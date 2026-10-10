// Bot-first Scam Guard: tap the bot → it connects + listens; alerts flash through the bot.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Vibration, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { useTheme } from '@/theme/ThemeProvider';
import {
  isRecord,
  isScamAlert,
  isSnapshotEvent,
  isTranscriptSegment,
  PiApiError,
  requestPiJson,
  websocketAddress,
  type ConnectionState,
  type ScamAlert,
  type ScamEvent,
  type TranscriptSegment,
} from '@/lib/scam-guard';

const PI_URL = 'http://10.94.221.88:8000';
const CONNECT_TIMEOUT_MS = 10_000;
const KEEP_ALIVE_MS = 15_000;

type BotState =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'alert';

function speakerLabel(speaker: ScamAlert['speaker']): string {
  if (speaker === 'caller') return 'Likely the caller';
  if (speaker === 'user') return 'Likely you';
  return 'Speaker unclear';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

function eventFromMessage(data: unknown): ScamEvent | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(data);
    return isRecord(parsed) && typeof parsed.type === 'string' ? (parsed as ScamEvent) : null;
  } catch {
    return null;
  }
}

export default function ScamBotScreen() {
  const { colors, dark } = useTheme();
  const [connection, setConnection] = useState<ConnectionState>('disconnected');
  const [active, setActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [latestAlert, setLatestAlert] = useState<ScamAlert | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wantedRef = useRef(false);
  const activeRef = useRef(false);
  const mountedRef = useRef(true);
  const lastEventIdRef = useRef(0);
  const snapshotResolverRef = useRef<((error?: Error) => void) | null>(null);

  // ─── Animation values ───────────────────────────────────────────────────────
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);
  const alertFlash = useSharedValue(0);
  const alertShake = useSharedValue(0);

  const botState: BotState =
    connection === 'connecting' || connection === 'checking' || connection === 'reconnecting' || busy
      ? 'connecting'
      : latestAlert
        ? 'alert'
        : processing
          ? 'thinking'
          : active
            ? 'listening'
            : connection === 'connected'
              ? 'ready'
              : 'idle';

  // Listening rings — pulse outward in staggered loop
  useEffect(() => {
    const listening = botState === 'listening' || botState === 'thinking' || botState === 'alert';
    if (!listening) {
      cancelAnimation(ring1);
      cancelAnimation(ring2);
      cancelAnimation(ring3);
      ring1.value = 0;
      ring2.value = 0;
      ring3.value = 0;
      return;
    }
    const loop = (value: typeof ring1, delay: number) => {
      value.value = withRepeat(
        withSequence(
          withTiming(0, { duration: delay }),
          withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
        ),
        -1,
        false,
      );
    };
    loop(ring1, 0);
    loop(ring2, 600);
    loop(ring3, 1200);
    return () => {
      cancelAnimation(ring1);
      cancelAnimation(ring2);
      cancelAnimation(ring3);
    };
  }, [botState, ring1, ring2, ring3]);

  // Alert flash + shake whenever a new alert arrives
  useEffect(() => {
    if (!latestAlert) return;
    alertFlash.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 1200 }),
    );
    alertShake.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
    if (Platform.OS !== 'web') Vibration.vibrate([0, 300, 100, 300]);
    const t = setTimeout(() => setLatestAlert(null), 3200);
    return () => clearTimeout(t);
  }, [latestAlert, alertFlash, alertShake]);

  const ringColor = botState === 'alert' ? colors.coral : colors.indigo;
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + ring1.value * 1.6 }],
    opacity: ring1.value === 0 ? 0 : 1 - ring1.value,
    borderColor: ringColor,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + ring2.value * 1.6 }],
    opacity: ring2.value === 0 ? 0 : 1 - ring2.value,
    borderColor: ringColor,
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + ring3.value * 1.6 }],
    opacity: ring3.value === 0 ? 0 : 1 - ring3.value,
    borderColor: ringColor,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: alertFlash.value * 0.55,
  }));
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: alertShake.value }],
  }));

  // ─── Event handling ─────────────────────────────────────────────────────────
  const applyEvent = useCallback((event: ScamEvent) => {
    if (isSnapshotEvent(event)) {
      lastEventIdRef.current = 0;
      activeRef.current = event.active;
      setActive(event.active);
      setSegments(event.segments.filter(isTranscriptSegment));
      setAlerts(event.alerts.filter(isScamAlert));
      setProcessing(event.llm_busy === true);
      setConnection('connected');
      setError('');
      snapshotResolverRef.current?.();
      snapshotResolverRef.current = null;
      return;
    }
    if (typeof event.event_id === 'number') {
      if (event.event_id <= lastEventIdRef.current) return;
      lastEventIdRef.current = event.event_id;
    }
    switch (event.type) {
      case 'listening':
        activeRef.current = true;
        setActive(true);
        setSegments([]);
        setAlerts([]);
        setNotice(typeof event.message === 'string' ? event.message : 'Monitoring started.');
        break;
      case 'transcript':
        if (isTranscriptSegment(event)) setSegments((c) => [...c, event]);
        break;
      case 'warning':
        if (isScamAlert(event)) {
          setAlerts((current) => {
            const existing = current.find((a) => a.segment_id === event.segment_id);
            if (existing && event.revision <= existing.revision) return current;
            return existing
              ? current.map((a) => (a.segment_id === event.segment_id ? event : a))
              : [...current, event];
          });
          setLatestAlert(event);
        }
        break;
      case 'processing':
        setProcessing(event.active === true);
        break;
      case 'stopped':
        activeRef.current = false;
        setActive(false);
        setProcessing(false);
        setNotice(typeof event.message === 'string' ? event.message : 'Monitoring stopped.');
        break;
      case 'error':
        if (typeof event.message === 'string') setNotice(event.message);
        break;
      default:
        break;
    }
  }, []);

  const openSocket = useCallback(
    (base: string) =>
      new Promise<void>((resolve, reject) => {
        let settled = false;
        let socket: WebSocket | null = null;
        const finish = (failure?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(snapshotTimeout);
          if (snapshotResolverRef.current === finish) snapshotResolverRef.current = null;
          if (failure) {
            socket?.close();
            reject(failure);
          } else resolve();
        };
        const snapshotTimeout = setTimeout(
          () => finish(new Error('Connected to the Pi, but no status snapshot arrived.')),
          CONNECT_TIMEOUT_MS,
        );
        try { socket = new WebSocket(websocketAddress(base)); }
        catch (e) { finish(new Error(errorMessage(e))); return; }
        socketRef.current = socket;
        snapshotResolverRef.current = finish;
        setConnection('connecting');

        socket.onopen = () => {
          if (pingTimerRef.current) clearInterval(pingTimerRef.current);
          pingTimerRef.current = setInterval(() => {
            if (socket!.readyState === WebSocket.OPEN) socket!.send('ping');
          }, KEEP_ALIVE_MS);
        };
        socket.onmessage = ({ data }) => {
          const ev = eventFromMessage(data);
          if (!ev) return;
          applyEvent(ev);
          if (ev.type === 'snapshot') finish();
        };
        socket.onerror = () => {
          if (!settled) finish(new Error('Could not open the Pi event stream.'));
        };
        socket.onclose = () => {
          if (!settled) finish(new Error('The Pi closed the event stream.'));
          if (socketRef.current === socket) socketRef.current = null;
        };
      }),
    [applyEvent],
  );

  const disconnect = useCallback(() => {
    wantedRef.current = false;
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    pingTimerRef.current = null;
    snapshotResolverRef.current?.(new Error('Cancelled.'));
    snapshotResolverRef.current = null;
    socketRef.current?.close();
    socketRef.current = null;
    setConnection('disconnected');
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (activeRef.current) {
        void requestPiJson(`${PI_URL}/stop`, { method: 'POST' }).catch(() => undefined);
      }
      wantedRef.current = false;
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      socketRef.current?.close();
    };
  }, []);

  // ─── Flow: tap the bot → connect + start monitoring ────────────────────────
  const connectAndListen = async () => {
    if (activeRef.current) return;
    if (Platform.OS === 'web') {
      setError('The Pi API does not allow browser cross-origin requests. Use the iOS or Android app.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (connection !== 'connected') {
        setConnection('checking');
        await requestPiJson(`${PI_URL}/health`);
        wantedRef.current = true;
        await openSocket(PI_URL);
      }
      const result = await requestPiJson<{ ok: boolean; call_id: string }>(`${PI_URL}/start`, { method: 'POST' });
      activeRef.current = true;
      setActive(true);
      setNotice(`Listening (${result.call_id})`);
    } catch (e) {
      if (e instanceof PiApiError && e.status === 409 && e.code === 'already_monitoring') {
        setNotice('Already listening to this call.');
      } else {
        setError(errorMessage(e));
        setConnection('error');
      }
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const stopListening = async () => {
    setBusy(true);
    try {
      await requestPiJson(`${PI_URL}/stop`, { method: 'POST' });
      activeRef.current = false;
      setActive(false);
      setProcessing(false);
      setNotice('Monitoring stopped. The bot is still linked to the Pi.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // ─── Caption + ring color ──────────────────────────────────────────────────
  const captionFor: Record<BotState, { title: string; subtitle: string }> = {
    idle:       { title: 'Tap me to start listening',   subtitle: `Pi · ${PI_URL.replace(/^https?:\/\//, '')}` },
    connecting: { title: 'Reaching the Pi…',            subtitle: 'Opening the live link' },
    ready:      { title: 'Linked, ready to listen',     subtitle: 'Tap again to start monitoring' },
    listening:  { title: 'Listening to the call',       subtitle: 'The Pi is streaming speech' },
    thinking:   { title: 'Checking what was said',      subtitle: 'Pi is analyzing a segment' },
    alert:      { title: '⚠️ Possible scam detected',    subtitle: latestAlert ? speakerLabel(latestAlert.speaker) : '' },
  };
  const caption = captionFor[botState];

  const haloColor =
    botState === 'alert' ? colors.coral
    : botState === 'thinking' ? colors.marigold
    : botState === 'listening' ? colors.sage
    : botState === 'connecting' ? colors.marigold
    : botState === 'ready' ? colors.indigo
    : colors.ink3;

  return (
    <Screen title="Scam Guard" screen="fraud" showBack showScopeBar={false}>
      {/* Stage with the bot */}
      <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
        <View style={styles.stage}>
          {/* Pulse rings */}
          <Animated.View pointerEvents="none" style={[styles.ring, ring3Style]} />
          <Animated.View pointerEvents="none" style={[styles.ring, ring2Style]} />
          <Animated.View pointerEvents="none" style={[styles.ring, ring1Style]} />

          {/* Red alert flash overlay */}
          <Animated.View pointerEvents="none" style={[styles.flash, flashStyle, { backgroundColor: colors.coral }]} />

          {/* The bot itself */}
          <Animated.View style={shakeStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={active ? 'Stop listening' : 'Start listening'}
              onPress={() => (active ? void stopListening() : void connectAndListen())}
              disabled={busy}
              style={({ pressed }) => [
                styles.botCircle,
                {
                  borderColor: haloColor,
                  backgroundColor: dark ? colors.surface2 : '#FFFFFF',
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Mascot size={90} />
            </Pressable>
          </Animated.View>
        </View>

        <AppText type="h3" style={{ marginTop: 22, textAlign: 'center' }}>{caption.title}</AppText>
        <AppText type="caption" muted style={{ marginTop: 4, textAlign: 'center' }}>{caption.subtitle}</AppText>

        {/* Current alert chip */}
        {latestAlert && (
          <View style={[styles.alertChip, { backgroundColor: colors.coralSoft, borderColor: colors.coral }]}>
            <AppText type="captionMed" color={colors.coral} numberOfLines={2}>
              “{latestAlert.evidence}”
            </AppText>
            <AppText type="caption" muted style={{ marginTop: 2 }}>{latestAlert.message}</AppText>
          </View>
        )}

        {/* Secondary controls */}
        <View style={styles.controls}>
          {active ? (
            <Button label={busy ? 'Stopping…' : 'Stop listening'} variant="soft" disabled={busy} onPress={() => void stopListening()} />
          ) : connection === 'connected' ? (
            <Button label={busy ? 'Starting…' : 'Start listening'} variant="primary" disabled={busy} onPress={() => void connectAndListen()} />
          ) : null}
          {connection === 'connected' && !active && (
            <Button label="Disconnect" disabled={busy} onPress={disconnect} />
          )}
        </View>
      </Card>

      {notice ? (
        <Card flat style={{ backgroundColor: colors.indigoSoft }}>
          <AppText type="labelMed" color={colors.indigo}>{notice}</AppText>
        </Card>
      ) : null}
      {error ? (
        <Card flat style={{ backgroundColor: colors.coralSoft }}>
          <AppText type="labelMed" color={colors.coral}>{error}</AppText>
        </Card>
      ) : null}

      {/* Alert history */}
      {alerts.length > 0 && (
        <Card>
          <AppText type="h3" style={{ marginBottom: 10 }}>
            {alerts.length} warning{alerts.length === 1 ? '' : 's'} this call
          </AppText>
          {alerts.slice().reverse().map((a) => (
            <View
              key={a.segment_id}
              style={[
                styles.histCard,
                {
                  backgroundColor: a.risk === 'warn' ? colors.coralSoft : colors.marigoldSoft,
                  borderColor: a.risk === 'warn' ? colors.coral : colors.marigold,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <AppText style={{ fontSize: 20 }}>{a.risk === 'warn' ? '⚠️' : '👀'}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText type="labelMed" color={a.risk === 'warn' ? colors.coral : dark ? colors.marigold : '#9A6200'}>
                    {a.risk === 'warn' ? 'Possible scam request' : 'Be careful'}
                  </AppText>
                  <AppText type="captionSm" muted>{speakerLabel(a.speaker)} · {a.source}</AppText>
                </View>
              </View>
              <AppText type="label" style={{ marginTop: 8 }}>“{a.evidence}”</AppText>
              <AppText type="caption" style={{ marginTop: 4 }}>{a.message}</AppText>
            </View>
          ))}
        </Card>
      )}

      {/* Live transcript */}
      {segments.length > 0 && (
        <Card>
          <AppText type="h3" style={{ marginBottom: 8 }}>Live transcript</AppText>
          {segments.slice(-8).map((s) => (
            <View key={s.segment_id} style={[styles.txRow, { borderTopColor: colors.line }]}>
              <AppText type="captionSm" muted style={{ width: 42 }}>
                {Math.floor(s.start_ms / 60000)}:{String(Math.floor((s.start_ms / 1000) % 60)).padStart(2, '0')}
              </AppText>
              <AppText type="label" style={{ flex: 1 }}>{s.text}</AppText>
            </View>
          ))}
        </Card>
      )}

      <Card flat style={{ marginTop: 2 }}>
        <AppText type="captionSm" muted>
          The bot cannot catch every scam. Never share OTPs, PINs, passwords, or card details on an unsolicited call,
          even if no warning appears.
        </AppText>
      </Card>
    </Screen>
  );
}

const RING_SIZE = 220;

const styles = StyleSheet.create({
  stage: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  flash: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
  },
  botCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertChip: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'stretch',
  },
  controls: { flexDirection: 'row', gap: 8, marginTop: 18 },
  histCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8 },
  txRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
