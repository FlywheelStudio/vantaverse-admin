import toast from 'react-hot-toast';

/**
 * Toast for UI actions that exist in the HTML mock but lack queries/APIs yet.
 */
export function toastUnavailable(feature: string): void {
  toast(`${feature} isn't available yet — missing data or APIs for this action.`);
}
