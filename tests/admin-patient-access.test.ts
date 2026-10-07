import { PatientListController } from '../src/components/admin/PatientList/PatientListController';

function buildController(updateAccess: jest.Mock) {
  const service = {
    updateAccess,
    filterPatients: (patients: unknown[]) => patients,
    getDisplayName: () => 'Test Patient',
    getSecondaryInfo: () => 'u-test-1',
  };
  const onShowToast = jest.fn();
  const ctrl = new PatientListController(service as any);

  ctrl.init({
    listContainer: document.createElement('div'),
    emptyContainer: document.createElement('div'),
    searchInput: null,
    addInput: null,
    addButton: null,
    onShowToast,
  } as any);

  const patients = [{ userId: 'u-test-1', accessEnabled: true, mealsCount: 0 }];
  (ctrl as any).patients = patients;
  (ctrl as any).filteredPatients = patients;

  return { ctrl, onShowToast };
}

describe('PatientListController access toggle', () => {
  it('shows an error toast when the access update is rejected', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { ctrl, onShowToast } = buildController(
      jest.fn().mockRejectedValue(new Error('Failed to update access')),
    );

    await (ctrl as any).handleToggleAccess('u-test-1', false);

    expect(onShowToast).toHaveBeenCalledWith('Kļūda mainot piekļuvi', 'error');
    expect(onShowToast).not.toHaveBeenCalledWith(expect.anything(), 'success');
    errorSpy.mockRestore();
  });

  it('confirms a revoke with a success toast that does not read as access denied', async () => {
    const { ctrl, onShowToast } = buildController(jest.fn().mockResolvedValue(undefined));

    await (ctrl as any).handleToggleAccess('u-test-1', false);

    expect(onShowToast).toHaveBeenCalledWith('Piekļuve dienasgrāmatai izslēgta', 'success');
    expect(onShowToast).not.toHaveBeenCalledWith('Piekļuve liegta', expect.anything());
  });

  it('confirms a grant with a success toast naming the diary', async () => {
    const { ctrl, onShowToast } = buildController(jest.fn().mockResolvedValue(undefined));

    await (ctrl as any).handleToggleAccess('u-test-1', true);

    expect(onShowToast).toHaveBeenCalledWith('Piekļuve dienasgrāmatai ieslēgta', 'success');
  });
});
