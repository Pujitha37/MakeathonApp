// Ported from `groupedTx()` in finprofile.html.
import React from 'react';
import { TODAY } from '@/data/seed';
import { iso } from '@/lib/format';
import type { Tx } from '@/data/types';
import { DayHeader, groupedKey, TxRow } from './TxRow';

export function GroupedTxList({ list, showSrc, recurFn }: { list: Tx[]; showSrc?: boolean; recurFn?: (t: Tx) => boolean }) {
  const today = iso(TODAY);
  const yest = iso(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 1));
  let last = '';
  return (
    <>
      {list.map((t) => {
        const newGroup = t.date !== last;
        if (newGroup) last = t.date;
        return (
          <React.Fragment key={t.id}>
            {newGroup && <DayHeader label={groupedKey(t, today, yest)} />}
            <TxRow t={t} showSrc={showSrc} recurring={recurFn?.(t)} />
          </React.Fragment>
        );
      })}
    </>
  );
}
