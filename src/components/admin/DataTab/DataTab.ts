/**
 * DataTab Controller - Azure Table Storage browser
 * Following Single Responsibility and SOLID principles
 */

interface TableData {
  entities: any[];
  columns: string[];
}

interface DataTabConfig {
  onShowToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  onShowConfirm: (message: string, title?: string) => Promise<boolean>;
}

export class DataTabController {
  private apiBase: string;
  private onShowToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  private onShowConfirm: (message: string, title?: string) => Promise<boolean>;
  private currentTableData: TableData | null = null;
  private filteredTableData: any[] = [];
  private selectedRows: Set<string> = new Set();
  private currentSortColumn: string | null = null;
  private currentSortDirection: 'asc' | 'desc' = 'asc';

  // DOM elements
  private elements!: {
    tableSelect: HTMLSelectElement | null;
    refreshBtn: HTMLButtonElement | null;
    exportBtn: HTMLButtonElement | null;
    loading: HTMLElement | null;
    container: HTMLElement | null;
    filters: HTMLElement | null;
    empty: HTMLElement | null;
    tableHeader: HTMLElement | null;
    tableBody: HTMLElement | null;
    tableCount: HTMLElement | null;
    filteredCount: HTMLElement | null;
    searchInput: HTMLInputElement | null;
    statusFilter: HTMLSelectElement | null;
    dateFromInput: HTMLInputElement | null;
    dateToInput: HTMLInputElement | null;
    clearFiltersBtn: HTMLButtonElement | null;
    batchActions: HTMLElement | null;
    selectedCountEl: HTMLElement | null;
    batchDeleteBtn: HTMLButtonElement | null;
    batchExportBtn: HTMLButtonElement | null;
    deselectAllBtn: HTMLButtonElement | null;
  };

  constructor(config: DataTabConfig, apiBase: string) {
    this.onShowToast = config.onShowToast;
    this.onShowConfirm = config.onShowConfirm;
    this.apiBase = apiBase;
  }

  /**
   * Initialize the DataTab controller
   */
  init(): void {
    this.initDOMElements();
    this.setupEventListeners();
    this.exposeGlobalFunctions();
  }

  /**
   * Initialize DOM element references
   */
  private initDOMElements(): void {
    this.elements = {
      tableSelect: document.getElementById('table-select') as HTMLSelectElement | null,
      refreshBtn: document.getElementById('refresh-table') as HTMLButtonElement | null,
      exportBtn: document.getElementById('export-csv') as HTMLButtonElement | null,
      loading: document.getElementById('table-loading'),
      container: document.getElementById('table-container'),
      filters: document.getElementById('table-filters'),
      empty: document.getElementById('table-empty'),
      tableHeader: document.getElementById('table-header'),
      tableBody: document.getElementById('table-body'),
      tableCount: document.getElementById('table-count'),
      filteredCount: document.getElementById('filtered-count'),
      searchInput: document.getElementById('table-search') as HTMLInputElement | null,
      statusFilter: document.getElementById('filter-status') as HTMLSelectElement | null,
      dateFromInput: document.getElementById('filter-date-from') as HTMLInputElement | null,
      dateToInput: document.getElementById('filter-date-to') as HTMLInputElement | null,
      clearFiltersBtn: document.getElementById('clear-filters') as HTMLButtonElement | null,
      batchActions: document.getElementById('batch-actions'),
      selectedCountEl: document.getElementById('selected-count'),
      batchDeleteBtn: document.getElementById('batch-delete') as HTMLButtonElement | null,
      batchExportBtn: document.getElementById('batch-export') as HTMLButtonElement | null,
      deselectAllBtn: document.getElementById('deselect-all') as HTMLButtonElement | null,
    };
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.elements.tableSelect?.addEventListener('change', () => this.loadTableData());
    this.elements.refreshBtn?.addEventListener('click', () => this.loadTableData());
    this.elements.exportBtn?.addEventListener('click', () => this.exportTableToCSV());

    // Filter listeners
    this.elements.searchInput?.addEventListener('input', () => this.applyFilters());
    this.elements.statusFilter?.addEventListener('change', () => this.applyFilters());
    this.elements.dateFromInput?.addEventListener('change', () => this.applyFilters());
    this.elements.dateToInput?.addEventListener('change', () => this.applyFilters());
    this.elements.clearFiltersBtn?.addEventListener('click', () => this.clearFilters());

    // Batch action listeners
    this.elements.batchDeleteBtn?.addEventListener('click', () => this.batchDelete());
    this.elements.batchExportBtn?.addEventListener('click', () => this.batchExport());
    this.elements.deselectAllBtn?.addEventListener('click', () => this.deselectAll());
  }

  /**
   * Expose functions to window for onclick handlers
   */
  private exposeGlobalFunctions(): void {
    (window as any).deleteEntity = (pk: string, rk: string) => this.deleteEntity(pk, rk);
    (window as any).sortTable = (column: string) => this.sortTable(column);
  }

  /**
   * Load table data from API
   */
  async loadTableData(): Promise<void> {
    const tableName = this.elements.tableSelect?.value || 'bookings';

    this.showLoading();
    this.selectedRows.clear();
    this.updateBatchActionsUI();

    try {
      const response = await fetch(`${this.apiBase}/dashboard/tables/${tableName}`);
      const data = await response.json();
      this.currentTableData = data;
      this.filteredTableData = data.entities || [];

      this.hideLoading();

      if (!data.entities || data.entities.length === 0) {
        this.showEmpty();
        this.updateTableCount(0);
        this.elements.filters?.classList.add('hidden');
        return;
      }

      this.elements.filters?.classList.remove('hidden');
      this.applyFilters();
    } catch (error: unknown) {
      this.showError((error as Error).message);
    }
  }

  /**
   * Apply filters to table data
   */
  private applyFilters(): void {
    if (!this.currentTableData || !this.currentTableData.entities) return;

    const searchTerm = this.elements.searchInput?.value.toLowerCase() || '';
    const statusFilter = this.elements.statusFilter?.value || '';
    const dateFrom = this.elements.dateFromInput?.value || '';
    const dateTo = this.elements.dateToInput?.value || '';

    let filtered = this.currentTableData.entities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((entity: any) => {
        return Object.values(entity).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((entity: any) => entity.status === statusFilter);
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((entity: any) => {
        const entityDate = entity.date;
        if (!entityDate) return false;

        const dateStr = entityDate.split('T')[0];

        if (dateFrom) {
          const [day, month, year] = dateFrom.split('/');
          const fromDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          if (dateStr < fromDate) return false;
        }

        if (dateTo) {
          const [day, month, year] = dateTo.split('/');
          const toDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          if (dateStr > toDate) return false;
        }

        return true;
      });
    }

    this.filteredTableData = filtered;
    this.renderTable();
    this.updateFilterCount();
  }

  /**
   * Sort table by column
   */
  private sortTable(column: string): void {
    if (this.currentSortColumn === column) {
      this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.currentSortDirection = 'asc';
    }

    this.filteredTableData.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      // Handle null/undefined
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Convert to string for comparison
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();

      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
      return this.currentSortDirection === 'asc' ? comparison : -comparison;
    });

    this.renderTable();
  }

  /**
   * Render table HTML
   */
  private renderTable(): void {
    if (!this.elements.tableHeader || !this.elements.tableBody || !this.currentTableData) return;

    const columns = this.currentTableData.columns || [];
    const allSelected =
      this.filteredTableData.length > 0 && this.selectedRows.size === this.filteredTableData.length;

    // Render header
    this.elements.tableHeader.innerHTML = `<tr>
      <th style="width: 50px;">
        <input type="checkbox" id="select-all" ${allSelected ? 'checked' : ''} 
               title="${allSelected ? 'Noņemt izvēli no visiem' : 'Izvēlēties visus'}">
      </th>
      ${columns
        .map(
          (col: string) => `
        <th onclick="sortTable('${col}')" style="cursor: pointer; user-select: none;">
          ${col}
          ${
            this.currentSortColumn === col
              ? this.currentSortDirection === 'asc'
                ? ' ▲'
                : ' ▼'
              : ' ⇅'
          }
        </th>
      `
        )
        .join('')}
      <th>Darbības</th>
    </tr>`;

    // Render body
    this.elements.tableBody.innerHTML = this.filteredTableData
      .map((entity) => {
        const pk = encodeURIComponent(entity.partitionKey || '');
        const rk = encodeURIComponent(entity.rowKey || '');
        const rowId = `${pk}_${rk}`;
        const isSelected = this.selectedRows.has(rowId);

        return `<tr class="${isSelected ? 'row-selected' : ''}" data-row-id="${rowId}">
          <td>
            <input type="checkbox" class="row-checkbox" data-row-id="${rowId}" 
                   ${isSelected ? 'checked' : ''}>
          </td>
          ${columns
            .map((col: string) => {
              let value = entity[col];
              if (value === undefined || value === null) value = '';
              if (typeof value === 'object') value = JSON.stringify(value);
              const displayValue =
                String(value).length > 40 ? String(value).substring(0, 40) + '...' : value;
              let style = '';
              if (col === 'status') {
                if (value === 'confirmed') style = 'color:#16a34a;font-weight:600;';
                else if (value === 'pending') style = 'color:#ca8a04;font-weight:600;';
                else if (value === 'cancelled') style = 'color:#dc2626;font-weight:600;';
              }
              return `<td style="${style}" title="${String(value).replace(/"/g, '&quot;')}">${displayValue}</td>`;
            })
            .join('')}
          <td>
            <button onclick="deleteEntity('${pk}', '${rk}')" class="btn-close" title="Dzēst">
              <i class="ph ph-trash"></i>
            </button>
          </td>
        </tr>`;
      })
      .join('');

    this.elements.container?.classList.remove('hidden');

    // Attach checkbox listeners
    this.attachCheckboxListeners();
  }

  /**
   * Attach checkbox event listeners
   */
  private attachCheckboxListeners(): void {
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
      selectAllCheckbox.replaceWith(selectAllCheckbox.cloneNode(true));
      document
        .getElementById('select-all')
        ?.addEventListener('change', (e) => this.handleSelectAll(e));
    }

    document.querySelectorAll('.row-checkbox').forEach((cb) => {
      cb.addEventListener('change', (e) => this.handleRowSelect(e));
    });
  }

  /**
   * Handle select all checkbox
   */
  private handleSelectAll(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.selectedRows.clear();

    if (checked) {
      this.filteredTableData.forEach((entity) => {
        const pk = encodeURIComponent(entity.partitionKey || '');
        const rk = encodeURIComponent(entity.rowKey || '');
        this.selectedRows.add(`${pk}_${rk}`);
      });
    }

    this.renderTable();
    this.updateBatchActionsUI();
  }

  /**
   * Handle individual row selection
   */
  private handleRowSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    const rowId = target.dataset.rowId;
    if (!rowId) return;

    if (target.checked) {
      this.selectedRows.add(rowId);
    } else {
      this.selectedRows.delete(rowId);
    }

    this.updateBatchActionsUI();

    // Update row styling
    const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
    if (row) {
      if (target.checked) {
        row.classList.add('row-selected');
      } else {
        row.classList.remove('row-selected');
      }
    }

    // Update select-all checkbox
    const selectAll = document.getElementById('select-all') as HTMLInputElement | null;
    if (selectAll) {
      selectAll.checked =
        this.selectedRows.size === this.filteredTableData.length &&
        this.filteredTableData.length > 0;
    }
  }

  /**
   * Update batch actions UI visibility
   */
  private updateBatchActionsUI(): void {
    if (this.elements.selectedCountEl) {
      this.elements.selectedCountEl.textContent = String(this.selectedRows.size);
    }

    if (this.selectedRows.size > 0) {
      this.elements.batchActions?.classList.remove('hidden');
    } else {
      this.elements.batchActions?.classList.add('hidden');
    }
  }

  /**
   * Delete entity by partition and row key
   */
  private async deleteEntity(partitionKey: string, rowKey: string): Promise<void> {
    const confirmed = await this.onShowConfirm('Vai tiešām dzēst šo ierakstu?', 'Dzēst ierakstu');
    if (!confirmed) return;

    const tableName = this.elements.tableSelect?.value;
    if (!tableName) return;

    try {
      const response = await fetch(
        `${this.apiBase}/dashboard/tables/${tableName}/${partitionKey}/${rowKey}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        this.loadTableData();
        this.onShowToast('Ieraksts dzēsts', 'success');
      } else {
        const error = await response.json();
        this.onShowToast(error.details || error.error, 'error');
      }
    } catch (e: unknown) {
      this.onShowToast((e as Error).message, 'error');
    }
  }

  /**
   * Batch delete selected rows
   */
  private async batchDelete(): Promise<void> {
    if (this.selectedRows.size === 0) return;

    const confirmed = await this.onShowConfirm(
      `Vai tiešām dzēst ${this.selectedRows.size} ierakstu${this.selectedRows.size === 1 ? '' : 's'}?`,
      'Dzēst ierakstus'
    );

    if (!confirmed) return;

    const tableName = this.elements.tableSelect?.value;
    if (!tableName) return;

    let successCount = 0;
    let errorCount = 0;

    for (const rowId of this.selectedRows) {
      const [pk, rk] = rowId.split('_').map(decodeURIComponent);

      try {
        const response = await fetch(
          `${this.apiBase}/dashboard/tables/${tableName}/${encodeURIComponent(pk)}/${encodeURIComponent(rk)}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (e: unknown) {
        errorCount++;
      }
    }

    this.selectedRows.clear();
    await this.loadTableData();

    if (errorCount === 0) {
      this.onShowToast(`${successCount} ieraksti dzēsti`, 'success');
    } else {
      this.onShowToast(`${successCount} dzēsti, ${errorCount} kļūdas`, 'warning');
    }
  }

  /**
   * Export selected rows to CSV
   */
  private batchExport(): void {
    if (this.selectedRows.size === 0 || !this.currentTableData) return;

    const columns = this.currentTableData.columns;
    const selectedEntities = this.filteredTableData.filter((entity) => {
      const pk = encodeURIComponent(entity.partitionKey || '');
      const rk = encodeURIComponent(entity.rowKey || '');
      return this.selectedRows.has(`${pk}_${rk}`);
    });

    this.exportToCSV(selectedEntities, columns, true);
    this.onShowToast(`${selectedEntities.length} ieraksti eksportēti`, 'success');
  }

  /**
   * Export all table data to CSV
   */
  private exportTableToCSV(): void {
    if (!this.currentTableData?.entities || this.currentTableData.entities.length === 0) {
      this.onShowToast('Nav datu eksportēšanai', 'warning');
      return;
    }

    const columns = this.currentTableData.columns;
    const rows = this.currentTableData.entities;
    this.exportToCSV(rows, columns, false);
  }

  /**
   * Helper method to generate and download CSV
   */
  private exportToCSV(data: any[], columns: string[], isSelection: boolean): void {
    const csvContent = [
      columns.join(','),
      ...data.map((row: any) =>
        columns
          .map((col: string) => {
            let value = row[col];
            if (value === undefined || value === null) return '';
            if (typeof value === 'object') value = JSON.stringify(value);
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('"') || value.includes('\n'))
              value = `"${value}"`;
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const tableName = this.elements.tableSelect?.value || 'export';
    const suffix = isSelection ? '_selected' : '';
    link.download = `${tableName}${suffix}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all filters
   */
  private clearFilters(): void {
    if (this.elements.searchInput) this.elements.searchInput.value = '';
    if (this.elements.statusFilter) this.elements.statusFilter.value = '';
    if (this.elements.dateFromInput) this.elements.dateFromInput.value = '';
    if (this.elements.dateToInput) this.elements.dateToInput.value = '';
    this.applyFilters();
  }

  /**
   * Deselect all rows
   */
  private deselectAll(): void {
    this.selectedRows.clear();
    this.renderTable();
    this.updateBatchActionsUI();
  }

  /**
   * Update filter count display
   */
  private updateFilterCount(): void {
    const total = this.currentTableData?.entities?.length || 0;
    const filtered = this.filteredTableData.length;

    this.updateTableCount(total);

    if (this.elements.filteredCount) {
      if (filtered < total) {
        this.elements.filteredCount.textContent = `(rāda ${filtered})`;
        this.elements.filteredCount.classList.remove('hidden');
      } else {
        this.elements.filteredCount.classList.add('hidden');
      }
    }
  }

  /**
   * Update table count
   */
  private updateTableCount(count: number): void {
    if (this.elements.tableCount) {
      this.elements.tableCount.textContent = String(count);
    }
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    this.elements.loading?.classList.remove('hidden');
    this.elements.container?.classList.add('hidden');
    this.elements.empty?.classList.add('hidden');
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    this.elements.loading?.classList.add('hidden');
  }

  /**
   * Show empty state
   */
  private showEmpty(): void {
    this.elements.empty?.classList.remove('hidden');
  }

  /**
   * Show error in loading area
   */
  private showError(message: string): void {
    if (this.elements.loading) {
      // Use textContent to avoid interpreting the message as HTML (prevents XSS)
      this.elements.loading.innerHTML = '';
      const span = document.createElement('span');
      span.style.color = '#dc2626';
      span.textContent = `Kļūda: ${message}`;
      this.elements.loading.appendChild(span);
    }
  }
}
