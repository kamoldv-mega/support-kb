<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket } from '#lib/kb/split';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const mixed = $derived(split.subjects.filter((s) => s.problems.length > 1).length);
</script>

<p>
  <strong>{split.subjects.length}</strong> subject lines, and <strong>{mixed}</strong> of them carry more than one problem.
  A subject says how the person noticed, not what broke.
</p>

<table>
  <thead><tr><th>subject (as decision 0001 keys it)</th><th>reports</th><th>problems under it</th></tr></thead>
  <tbody>
    {#each split.subjects as s (s.subject)}
      <tr class:mixed={s.problems.length > 1}>
        <td>{s.subject}</td>
        <td>{s.reports}</td>
        <td><code>{s.problems.join(' · ')}</code></td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .mixed td:last-child { color: var(--warn); font-weight: 600; }
</style>
