/**
 * Toast notification system for admin panel
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ShowToastFn = (message: string, type?: ToastType, title?: string | null) => void;
export type ShowConfirmFn = (message: string, title?: string) => Promise<boolean>;

export function showToast(message: string, type: ToastType = 'info', title: string | null = null): void {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons: Record<ToastType, string> = {
        success: 'ph-check-circle',
        error: 'ph-warning-circle',
        warning: 'ph-warning',
        info: 'ph-info'
    };
    
    const titles: Record<ToastType, string> = {
        success: title || 'Veiksmīgi',
        error: title || 'Kļūda',
        warning: title || 'Brīdinājums',
        info: title || 'Informācija'
    };
    
    toast.innerHTML = `
        <i class="ph ${icons[type]} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title"></div>
            <div class="toast-message"></div>
        </div>
        <button class="toast-close"><i class="ph ph-x"></i></button>
    `;
    (toast.querySelector('.toast-title') as HTMLElement).textContent = titles[type];
    (toast.querySelector('.toast-message') as HTMLElement).textContent = message;

    container.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close')?.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

function removeToast(toast: HTMLElement): void {
    toast.remove();
}

/**
 * Custom confirm dialog
 */
export function showConfirm(message: string, title: string = 'Apstiprināt darbību'): Promise<boolean> {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        
        dialog.innerHTML = `
            <div class="confirm-header">
                <i class="ph ph-question confirm-icon"></i>
                <h3></h3>
            </div>
            <div class="confirm-body">
                <p></p>
            </div>
            <div class="confirm-actions">
                <button class="btn-secondary confirm-cancel">Atcelt</button>
                <button class="btn-primary confirm-ok">Apstiprināt</button>
            </div>
        `;
        (dialog.querySelector('.confirm-header h3') as HTMLElement).textContent = title;
        (dialog.querySelector('.confirm-body p') as HTMLElement).textContent = message;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Focus on OK button
        setTimeout(() => (dialog.querySelector('.confirm-ok') as HTMLButtonElement)?.focus(), 100);
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close(false);
        };

        const close = (result: boolean) => {
            document.removeEventListener('keydown', handleEsc);
            overlay.remove();
            resolve(result);
        };

        dialog.querySelector('.confirm-ok')?.addEventListener('click', () => close(true));
        dialog.querySelector('.confirm-cancel')?.addEventListener('click', () => close(false));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });

        // ESC key to cancel
        document.addEventListener('keydown', handleEsc);
    });
}
