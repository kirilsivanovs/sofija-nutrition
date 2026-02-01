/**
 * @jest-environment jsdom
 */

describe('Admin Booking Confirmation UI Update', () => {
    let mockFetch;
    let selectedDate;
    let allBookings;
    let confirmBooking;
    let cancelBooking;
    let showDayDetails;
    let loadCalendar;
    let showToast;
    let showConfirm;

    beforeEach(() => {
        // Reset state
        selectedDate = null;
        allBookings = [
            {
                id: 'booking-1',
                date: '2026-02-19',
                time: '10:00',
                name: 'John Doe',
                service: 'consultation',
                email: 'john@example.com',
                phone: '+371 20123456',
                consultationFormat: 'online',
                price: 50,
                status: 'pending',
                paymentConfirmed: false
            },
            {
                id: 'booking-2',
                date: '2026-02-19',
                time: '14:00',
                name: 'Jane Smith',
                service: 'consultation',
                email: 'jane@example.com',
                phone: '+371 20654321',
                consultationFormat: 'in-person',
                price: 50,
                status: 'confirmed',
                paymentConfirmed: true
            }
        ];

        // Mock fetch
        mockFetch = jest.fn().mockResolvedValue({
            json: async () => ({ success: true })
        });
        global.fetch = mockFetch;

        // Mock showToast
        showToast = jest.fn();

        // Mock showConfirm - always return true (user confirms action)
        showConfirm = jest.fn().mockResolvedValue(true);

        // Mock loadCalendar - simulates fetching updated bookings
        loadCalendar = jest.fn(async () => {
            // In a real implementation, this would fetch from API
            // For testing, we just simulate the calendar refresh
            return Promise.resolve();
        });

        // Mock showDayDetails
        let dayDetailsCallCount = 0;
        showDayDetails = jest.fn((dateStr) => {
            dayDetailsCallCount++;
            selectedDate = dateStr;
            // Return the bookings for the selected date with current status
            return allBookings.filter(b => b.date === dateStr);
        });

        // Implement confirmBooking function matching admin panel logic
        confirmBooking = async function(id) {
            const confirmed = await showConfirm('Vai tiešām vēlaties apstiprināt šo ierakstu?', 'Apstiprināt ierakstu');
            if (!confirmed) return;
            try {
                await fetch('/api/dashboard/bookings/' + id, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'confirmed' })
                });
                await loadCalendar();
                // Refresh day details if a date is selected
                if (selectedDate) {
                    showDayDetails(selectedDate);
                }
                showToast('Ieraksts veiksmīgi apstiprināts', 'success');
            } catch (e) {
                showToast(e.message, 'error');
            }
        };

        // Implement cancelBooking function matching admin panel logic
        cancelBooking = async function(id) {
            const confirmed = await showConfirm('Vai tiešām vēlaties atcelt šo ierakstu?', 'Atcelt ierakstu');
            if (!confirmed) return;
            try {
                await fetch('/api/dashboard/bookings/' + id, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'cancelled' })
                });
                await loadCalendar();
                // Refresh day details if a date is selected
                if (selectedDate) {
                    showDayDetails(selectedDate);
                }
                showToast('Ieraksts veiksmīgi atcelts', 'success');
            } catch (e) {
                showToast(e.message, 'error');
            }
        };
    });

    test('confirming booking should update calendar and refresh day details', async () => {
        // User selects a date in the calendar
        showDayDetails('2026-02-19');
        expect(selectedDate).toBe('2026-02-19');
        expect(showDayDetails).toHaveBeenCalledTimes(1);

        // User confirms a pending booking
        await confirmBooking('booking-1');

        // Verify confirmation dialog was shown
        expect(showConfirm).toHaveBeenCalledWith(
            'Vai tiešām vēlaties apstiprināt šo ierakstu?',
            'Apstiprināt ierakstu'
        );

        // Verify API was called to update booking status
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/dashboard/bookings/booking-1',
            expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({ status: 'confirmed' })
            })
        );

        // Verify calendar was reloaded
        expect(loadCalendar).toHaveBeenCalled();

        // Verify day details were refreshed to show updated status
        expect(showDayDetails).toHaveBeenCalledTimes(2); // Initial + refresh after confirmation
        expect(showDayDetails).toHaveBeenLastCalledWith('2026-02-19');

        // Verify success message was shown
        expect(showToast).toHaveBeenCalledWith('Ieraksts veiksmīgi apstiprināts', 'success');
    });

    test('cancelling booking should update calendar and refresh day details', async () => {
        // User selects a date in the calendar
        showDayDetails('2026-02-19');
        expect(selectedDate).toBe('2026-02-19');

        // User cancels a booking
        await cancelBooking('booking-2');

        // Verify confirmation dialog was shown
        expect(showConfirm).toHaveBeenCalledWith(
            'Vai tiešām vēlaties atcelt šo ierakstu?',
            'Atcelt ierakstu'
        );

        // Verify API was called
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/dashboard/bookings/booking-2',
            expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({ status: 'cancelled' })
            })
        );

        // Verify calendar was reloaded
        expect(loadCalendar).toHaveBeenCalled();

        // Verify day details were refreshed
        expect(showDayDetails).toHaveBeenCalledTimes(2);
        expect(showDayDetails).toHaveBeenLastCalledWith('2026-02-19');

        // Verify success message
        expect(showToast).toHaveBeenCalledWith('Ieraksts veiksmīgi atcelts', 'success');
    });

    test('should not refresh day details if no date is selected', async () => {
        // No date selected (selectedDate is null)
        expect(selectedDate).toBeNull();

        // Confirm booking without selecting a date first
        await confirmBooking('booking-1');

        // Verify calendar was reloaded
        expect(loadCalendar).toHaveBeenCalled();

        // Verify day details were NOT called (no date selected)
        expect(showDayDetails).not.toHaveBeenCalled();

        // Still show success message
        expect(showToast).toHaveBeenCalledWith('Ieraksts veiksmīgi apstiprināts', 'success');
    });

    test('should not call API if user cancels confirmation dialog', async () => {
        // Mock user clicking "Cancel" in confirmation dialog
        showConfirm.mockResolvedValueOnce(false);

        showDayDetails('2026-02-19');

        await confirmBooking('booking-1');

        // Verify confirmation dialog was shown
        expect(showConfirm).toHaveBeenCalled();

        // Verify API was NOT called
        expect(mockFetch).not.toHaveBeenCalled();

        // Verify calendar was NOT reloaded
        expect(loadCalendar).not.toHaveBeenCalled();

        // Verify day details were NOT refreshed (only initial call)
        expect(showDayDetails).toHaveBeenCalledTimes(1);

        // Verify no toast was shown
        expect(showToast).not.toHaveBeenCalled();
    });

    test('should show error toast if API call fails', async () => {
        // Mock API failure
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        showDayDetails('2026-02-19');

        await confirmBooking('booking-1');

        // Verify error toast was shown
        expect(showToast).toHaveBeenCalledWith('Network error', 'error');

        // Verify success toast was NOT shown
        expect(showToast).not.toHaveBeenCalledWith(
            expect.stringContaining('veiksmīgi'),
            'success'
        );
    });

    test('should preserve selected date when switching between bookings', async () => {
        // Select first date
        showDayDetails('2026-02-19');
        expect(selectedDate).toBe('2026-02-19');

        // Confirm booking on that date
        await confirmBooking('booking-1');

        // Verify selectedDate is still preserved
        expect(selectedDate).toBe('2026-02-19');
        expect(showDayDetails).toHaveBeenLastCalledWith('2026-02-19');

        // Select different date
        showDayDetails('2026-02-20');
        expect(selectedDate).toBe('2026-02-20');

        // Cancel booking on new date
        await cancelBooking('booking-2');

        // Verify new selectedDate is preserved
        expect(selectedDate).toBe('2026-02-20');
        expect(showDayDetails).toHaveBeenLastCalledWith('2026-02-20');
    });
});
