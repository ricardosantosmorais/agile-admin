import { useCallback, useEffect, useReducer, useRef, useState, type DependencyList } from 'react';
import { translateCurrentLocale } from '@/src/i18n/utils';

type AsyncState<T> = {
	data: T | null;
	error: string;
	isLoading: boolean;
};

type AsyncAction<T> = { type: 'load-start' } | { type: 'load-success'; data: T } | { type: 'load-error'; error: string };

function asyncStateReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
	switch (action.type) {
		case 'load-start':
			return {
				data: state.data,
				error: '',
				isLoading: true,
			};
		case 'load-success':
			return {
				data: action.data,
				error: '',
				isLoading: false,
			};
		case 'load-error':
			return {
				data: null,
				error: action.error,
				isLoading: false,
			};
		default:
			return state;
	}
}

export function useAsyncData<T>(load: () => Promise<T>, deps: DependencyList) {
	const loadRef = useRef(load);
	const [reloadKey, setReloadKey] = useState(0);
	const [state, dispatch] = useReducer(asyncStateReducer<T>, {
		data: null,
		error: '',
		isLoading: true,
	});

	useEffect(() => {
		loadRef.current = load;
	}, [load]);

	const reload = useCallback(() => {
		setReloadKey((current) => current + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;

		dispatch({ type: 'load-start' });

		loadRef
			.current()
			.then((data) => {
				if (!isMounted) {
					return;
				}

				dispatch({ type: 'load-success', data });
			})
			.catch((error: unknown) => {
				if (!isMounted) {
					return;
				}

				dispatch({
					type: 'load-error',
					error: error instanceof Error ? error.message : translateCurrentLocale('async.errorTitle', 'Não foi possível carregar os dados'),
				});
			});

		return () => {
			isMounted = false;
		};
	}, [...deps, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

	return {
		...state,
		reload,
	};
}
