import { useEffect, useId, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'textarea:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement | null) {
	if (!container) {
		return [];
	}

	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
		if (element.hasAttribute('disabled')) {
			return false;
		}

		return element.getAttribute('aria-hidden') !== 'true';
	});
}

function getInitialFocusTarget(container: HTMLElement | null) {
	if (!container) {
		return null;
	}

	const preferredTarget = container.querySelector<HTMLElement>('[data-autofocus]');
	if (preferredTarget && !preferredTarget.hasAttribute('disabled')) {
		return preferredTarget;
	}

	const bodyContainer = container.querySelector<HTMLElement>('[data-dialog-body]');
	const bodyFocusableElements = getFocusableElements(bodyContainer).filter((element) => element.getAttribute('data-dialog-close') !== 'true');

	if (bodyFocusableElements.length) {
		return bodyFocusableElements[0];
	}

	const focusableElements = getFocusableElements(container).filter((element) => element.getAttribute('data-dialog-close') !== 'true');

	return focusableElements[0] ?? null;
}

function isTopmostDialog(container: HTMLElement | null) {
	if (!container || typeof document === 'undefined') {
		return false;
	}

	const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]'));

	return dialogs.at(-1) === container;
}

type UseDialogA11yOptions = {
	open: boolean;
	onClose: () => void;
};

export function useDialogA11y({ open, onClose }: UseDialogA11yOptions) {
	const titleId = useId();
	const descriptionId = useId();
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
	const onCloseRef = useRef(onClose);

	useEffect(() => {
		onCloseRef.current = onClose;
	}, [onClose]);

	useEffect(() => {
		if (!open || typeof document === 'undefined') {
			return;
		}

		previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		const dialog = dialogRef.current;
		const nextFocusTarget = getInitialFocusTarget(dialog) ?? dialog;
		nextFocusTarget?.focus();

		function handleKeyDown(event: KeyboardEvent) {
			if (!isTopmostDialog(dialogRef.current)) {
				return;
			}

			if (event.key === 'Escape') {
				event.preventDefault();
				onCloseRef.current();
				return;
			}

			if (event.key !== 'Tab') {
				return;
			}

			const currentFocusableElements = getFocusableElements(dialogRef.current);
			if (!currentFocusableElements.length) {
				event.preventDefault();
				dialogRef.current?.focus();
				return;
			}

			const first = currentFocusableElements[0];
			const last = currentFocusableElements[currentFocusableElements.length - 1];
			const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

			if (event.shiftKey) {
				if (activeElement === first || activeElement === dialogRef.current) {
					event.preventDefault();
					last.focus();
				}
				return;
			}

			if (activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			previouslyFocusedElementRef.current?.focus();
		};
	}, [open]);

	return {
		dialogRef,
		titleId,
		descriptionId,
	};
}
