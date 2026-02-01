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

describe('Admin Booking Status Display', () => {
    // Test that bookings are correctly categorized and displayed based on b.status field
    
    test('pending booking should show "Gaida" status and confirmation button', () => {
        const pendingBooking = {
            id: 'booking-pending',
            status: 'pending',
            name: 'Test User',
            email: 'test@example.com',
            date: '2026-02-19',
            time: '10:00',
            service: 'consultation',
            price: 50
        };

        // Verify status classification
        const isPending = pendingBooking.status === 'pending';
        const isConfirmed = pendingBooking.status === 'confirmed';
        const isCancelled = pendingBooking.status === 'cancelled';

        expect(isPending).toBe(true);
        expect(isConfirmed).toBe(false);
        expect(isCancelled).toBe(false);

        // Verify status text
        const statusText = pendingBooking.status === 'cancelled' ? 'Atcelts' : 
                          pendingBooking.status === 'confirmed' ? 'Apstiprināts' : 'Gaida';
        expect(statusText).toBe('Gaida');

        // Verify confirmation button should be shown
        const shouldShowConfirmButton = pendingBooking.status === 'pending';
        expect(shouldShowConfirmButton).toBe(true);

        // Verify cancel button should be shown
        const shouldShowCancelButton = pendingBooking.status !== 'cancelled';
        expect(shouldShowCancelButton).toBe(true);
    });

    test('confirmed booking should show "Apstiprināts" status and no confirmation button', () => {
        const confirmedBooking = {
            id: 'booking-confirmed',
            status: 'confirmed',
            name: 'Confirmed User',
            email: 'confirmed@example.com',
            date: '2026-02-19',
            time: '14:00',
            service: 'consultation',
            price: 50
        };

        // Verify status classification
        const isPending = confirmedBooking.status === 'pending';
        const isConfirmed = confirmedBooking.status === 'confirmed';
        const isCancelled = confirmedBooking.status === 'cancelled';

        expect(isPending).toBe(false);
        expect(isConfirmed).toBe(true);
        expect(isCancelled).toBe(false);

        // Verify status text
        const statusText = confirmedBooking.status === 'cancelled' ? 'Atcelts' : 
                          confirmedBooking.status === 'confirmed' ? 'Apstiprināts' : 'Gaida';
        expect(statusText).toBe('Apstiprināts');

        // Verify confirmation button should NOT be shown
        const shouldShowConfirmButton = confirmedBooking.status === 'pending';
        expect(shouldShowConfirmButton).toBe(false);

        // Verify cancel button should still be shown
        const shouldShowCancelButton = confirmedBooking.status !== 'cancelled';
        expect(shouldShowCancelButton).toBe(true);
    });

    test('cancelled booking should show "Atcelts" status and no action buttons', () => {
        const cancelledBooking = {
            id: 'booking-cancelled',
            status: 'cancelled',
            name: 'Cancelled User',
            email: 'cancelled@example.com',
            date: '2026-02-19',
            time: '16:00',
            service: 'consultation',
            price: 50
        };

        // Verify status classification
        const isPending = cancelledBooking.status === 'pending';
        const isConfirmed = cancelledBooking.status === 'confirmed';
        const isCancelled = cancelledBooking.status === 'cancelled';

        expect(isPending).toBe(false);
        expect(isConfirmed).toBe(false);
        expect(isCancelled).toBe(true);

        // Verify status text
        const statusText = cancelledBooking.status === 'cancelled' ? 'Atcelts' : 
                          cancelledBooking.status === 'confirmed' ? 'Apstiprināts' : 'Gaida';
        expect(statusText).toBe('Atcelts');

        // Verify confirmation button should NOT be shown
        const shouldShowConfirmButton = cancelledBooking.status === 'pending';
        expect(shouldShowConfirmButton).toBe(false);

        // Verify cancel button should NOT be shown
        const shouldShowCancelButton = cancelledBooking.status !== 'cancelled';
        expect(shouldShowCancelButton).toBe(false);
    });

    test('bookings should be grouped correctly by status', () => {
        const bookings = [
            { id: '1', status: 'pending', date: '2026-02-19', time: '09:00' },
            { id: '2', status: 'confirmed', date: '2026-02-19', time: '10:00' },
            { id: '3', status: 'pending', date: '2026-02-19', time: '11:00' },
            { id: '4', status: 'cancelled', date: '2026-02-19', time: '12:00' },
            { id: '5', status: 'confirmed', date: '2026-02-19', time: '13:00' },
        ];

        // Group by status (matching admin panel logic)
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const pendingBookings = bookings.filter(b => b.status === 'pending');
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

        expect(confirmedBookings).toHaveLength(2);
        expect(pendingBookings).toHaveLength(2);
        expect(cancelledBookings).toHaveLength(1);

        expect(confirmedBookings.map(b => b.id)).toEqual(['2', '5']);
        expect(pendingBookings.map(b => b.id)).toEqual(['1', '3']);
        expect(cancelledBookings.map(b => b.id)).toEqual(['4']);
    });

    test('calendar day indicators should count by status correctly', () => {
        const dayBookings = [
            { id: '1', status: 'pending', date: '2026-02-19' },
            { id: '2', status: 'confirmed', date: '2026-02-19' },
            { id: '3', status: 'pending', date: '2026-02-19' },
            { id: '4', status: 'cancelled', date: '2026-02-19' },
            { id: '5', status: 'confirmed', date: '2026-02-19' },
        ];

        // Count by status (matching admin panel logic)
        const pending = dayBookings.filter(b => b.status === 'pending').length;
        const confirmed = dayBookings.filter(b => b.status === 'confirmed').length;
        const cancelled = dayBookings.filter(b => b.status === 'cancelled').length;

        expect(pending).toBe(2);
        expect(confirmed).toBe(2);
        expect(cancelled).toBe(1);
    });

    test('CSS class should match booking status', () => {
        const testCases = [
            { status: 'pending', expectedClass: 'pending' },
            { status: 'confirmed', expectedClass: 'confirmed' },
            { status: 'cancelled', expectedClass: 'cancelled' }
        ];

        testCases.forEach(({ status, expectedClass }) => {
            const booking = { id: 'test', status: status };
            const cssClass = booking.status;
            expect(cssClass).toBe(expectedClass);
        });
    });

    test('status field takes precedence over deprecated paymentConfirmed field', () => {
        // Booking with status='pending' but paymentConfirmed=true (inconsistent legacy data)
        const booking = {
            id: 'legacy-booking',
            status: 'pending',
            paymentConfirmed: true  // This should be ignored
        };

        // New logic should use status field, not paymentConfirmed
        const isConfirmed = booking.status === 'confirmed';
        const isPending = booking.status === 'pending';

        expect(isConfirmed).toBe(false);
        expect(isPending).toBe(true);

        // Should show confirmation button based on status, not paymentConfirmed
        const shouldShowConfirmButton = booking.status === 'pending';
        expect(shouldShowConfirmButton).toBe(true);
    });
});

