<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import filed from '#lib/data/tickets-4471.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const tickets = filed.tickets as Record<string, { number: number; title: string }>;
  const issue = (p: Problem) => tickets[p];
  const href = (n: number) => `https://github.com/${filed.repo}/issues/${n}`;
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.reports}</strong> reports merged into #{ticket} ({split.rows} rows in the export, {split.rows - split.reports} of them
  repeats of the same id) · <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<p class="small">Counted the desk's way: a report counts where it is filed (by tenant and channel,
  <code>causes.ts</code>). Reports the desk reads as something else are shown again under that problem and footnoted.</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const t = issue(g.problem)}
      <tr class:open={!t}>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.ids.length}</strong>{#if g.filedUnder}<br /><span class="small">also counted in <code>{g.filedUnder}</code></span>{/if}</td>
        <td>{g.tenants.length}</td>
        <td class="small">{channels(g.channels)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if t}<a href={href(t.number)}>#{t.number}</a> {t.title}{:else}no ticket yet{/if}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td><strong>{split.groups.filter((g) => !g.filedUnder).reduce((n, g) => n + g.ids.length, 0)}</strong></td><td colspan="4"></td></tr>
  </tfoot>
</table>

<details>
  <summary>Which reports are in which problem</summary>
  {#each split.groups as g (g.problem)}
    <p class="small"><code>{g.problem}</code> ({g.ids.length}): {g.ids.join(', ')}</p>
  {/each}
</details>

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  details p { word-break: break-word; }
</style>
