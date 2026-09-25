import { MealsTabController } from '../src/components/admin/MealsTab/MealsTab';
import { PatientListController } from '../src/components/admin/PatientList/PatientListController';
import { DataTabController } from '../src/components/admin/DataTab/DataTab';

const PAYLOAD = '<img src=x onerror=alert(1)>';

describe('MealsTabController', () => {
  it('renders meal item names as text, not markup', () => {
    const div = document.createElement('div');
    const dayData = {
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0,
      meals: [],
      mealsByType: {
        breakfast: [
          {
            createdAt: '2026-09-25T08:00:00.000Z',
            mealType: 'breakfast',
            totalCalories: 100,
            totalProtein: 5,
            totalFat: 5,
            totalCarbs: 5,
            items: [{ name: PAYLOAD, weight: 100 }],
          },
        ],
        lunch: [],
        dinner: [],
        snack: [],
      },
    };

    (MealsTabController.prototype as any).renderModalContent.call(
      { elements: { modalContent: div }, formatMealTime: () => '08:00' },
      dayData
    );

    expect(div.querySelector('img')).toBeNull();
    expect(div.textContent).toContain(PAYLOAD);
  });
});

describe('PatientListController', () => {
  it('renders patient display name and secondary info as text', () => {
    const stub = {
      getDisplayName: () => PAYLOAD,
      getSecondaryInfo: () => 'u-test-1',
    };
    const ctrl = new PatientListController(stub as any);
    const listContainer = document.createElement('div');
    const emptyContainer = document.createElement('div');

    ctrl.init({
      listContainer,
      emptyContainer,
      searchInput: null,
      addInput: null,
      addButton: null,
    });

    (ctrl as any).filteredPatients = [
      { userId: 'u-test-1', accessEnabled: true, mealsCount: 0 },
    ];
    (ctrl as any).render();

    expect(listContainer.querySelector('img')).toBeNull();
    expect(listContainer.textContent).toContain(PAYLOAD);

    const item = listContainer.querySelector('.patient-item') as HTMLElement;
    expect(item.dataset.userId).toBe('u-test-1');
  });
});

describe('DataTabController', () => {
  it('renders table headers and cells without inline handlers', () => {
    const ctrl = new DataTabController(
      { onShowToast: jest.fn(), onShowConfirm: jest.fn() } as any,
      ''
    );

    const tableHeader = document.createElement('div');
    const tableBody = document.createElement('div');
    const container = document.createElement('div');

    (ctrl as any).elements = {
      tableSelect: null,
      refreshBtn: null,
      exportBtn: null,
      loading: null,
      container,
      filters: null,
      empty: null,
      tableHeader,
      tableBody,
      tableCount: null,
      filteredCount: null,
      searchInput: null,
      statusFilter: null,
      dateFromInput: null,
      dateToInput: null,
      clearFiltersBtn: null,
      batchActions: null,
      selectedCountEl: null,
      batchDeleteBtn: null,
      batchExportBtn: null,
      deselectAllBtn: null,
    };

    const maliciousColumn = "x');alert(1);//";
    (ctrl as any).currentTableData = {
      entities: [],
      columns: [maliciousColumn],
    };
    (ctrl as any).filteredTableData = [
      { partitionKey: 'pk-1', rowKey: 'rk-1', [maliciousColumn]: PAYLOAD },
    ];

    const deleteSpy = jest.spyOn(ctrl as any, 'deleteEntity').mockResolvedValue(undefined);

    (ctrl as any).setupEventListeners();
    (ctrl as any).renderTable();

    expect(tableHeader.querySelector('img')).toBeNull();
    expect(tableBody.querySelector('img')).toBeNull();
    expect(tableHeader.querySelector('[onclick]')).toBeNull();
    expect(tableBody.querySelector('[onclick]')).toBeNull();

    const deleteButton = tableBody.querySelector('[data-delete-pk]') as HTMLElement;
    expect(deleteButton).not.toBeNull();
    deleteButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(deleteSpy).toHaveBeenCalled();
  });
});
