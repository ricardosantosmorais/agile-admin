'use client';

import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { translateDashboardPresetLabel } from '@/src/features/dashboard/services/dashboard-i18n';
import { useI18n } from '@/src/i18n/use-i18n';

export type DateRangeValue = {
	start: string;
	end: string;
};

export type DateRangePreset = {
	id: string;
	label: string;
	range: DateRangeValue;
};

type DateRangeComparativePickerProps = {
	value: DateRangeValue;
	onChange: (nextValue: DateRangeValue) => void;
	previousValue: DateRangeValue | null;
	onPreviousChange: (nextValue: DateRangeValue | null) => void;
	presets: DateRangePreset[];
	maxDays?: number;
	align?: 'left' | 'right';
};

function formatDisplayDate(date: string) {
	const [year, month, day] = date.split('-');
	return `${day}/${month}/${year}`;
}

function getInclusiveDifferenceInDays(start: string, end: string) {
	const startDate = new Date(`${start}T00:00:00`);
	const endDate = new Date(`${end}T00:00:00`);
	const difference = endDate.getTime() - startDate.getTime();
	return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
}

function parseDateParts(value: string) {
	const [year, month, day] = value.split('-').map(Number);
	return { year, month, day };
}

function formatDateFromParts(year: number, month: number, day: number) {
	const safeDate = new Date(year, month - 1, day);
	return safeDate.toISOString().slice(0, 10);
}

function getMonthName(month: number, locale: string) {
	return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, month - 1, 1));
}

type DateRangeSectionProps = {
	label: string;
	value: string;
	onChange: (newValue: string) => void;
	onShiftMonth: (step: number) => void;
	locale: string;
	yearOptions: number[];
};

function DateRangeSection({ label, value, onChange, onShiftMonth, locale, yearOptions }: DateRangeSectionProps) {
	const parts = parseDateParts(value);
	const monthNames = Array.from({ length: 12 }, (_, index) => index + 1).map((month) => ({
		month,
		name: getMonthName(month, locale),
	}));

	function updatePart(nextYear: number, nextMonth: number) {
		const maxDay = new Date(nextYear, nextMonth, 0).getDate();
		const nextDay = Math.min(parts.day, maxDay);
		const nextValue = formatDateFromParts(nextYear, nextMonth, nextDay);
		onChange(nextValue);
	}

	return (
		<div className="rounded-[1rem] border border-line bg-surface p-3">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => onShiftMonth(-1)}
						className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-600 transition hover:border-accent/20 hover:text-accent"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => onShiftMonth(1)}
						className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-600 transition hover:border-accent/20 hover:text-accent"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
			</div>

			<div className="grid gap-2 sm:grid-cols-[1.3fr_1fr]">
				<select
					value={parts.month}
					onChange={(event) => updatePart(parts.year, Number(event.target.value))}
					className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-accent/30"
				>
					{monthNames.map(({ month, name }) => (
						<option key={month} value={month}>
							{name}
						</option>
					))}
				</select>

				<select
					value={parts.year}
					onChange={(event) => updatePart(Number(event.target.value), parts.month)}
					className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-accent/30"
				>
					{yearOptions.map((year) => (
						<option key={year} value={year}>
							{year}
						</option>
					))}
				</select>
			</div>

			<input
				type="date"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="mt-2 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-accent/30"
			/>
		</div>
	);
}

export function DateRangeComparativePicker({ value, onChange, previousValue, onPreviousChange, presets, maxDays = 90, align = 'right' }: DateRangeComparativePickerProps) {
	const { locale, t } = useI18n();
	const rootRef = useRef<HTMLDivElement | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [draftValue, setDraftValue] = useState<DateRangeValue>(value);
	const [draftPreviousValue, setDraftPreviousValue] = useState<DateRangeValue | null>(previousValue);
	const [isComparisonMode, setIsComparisonMode] = useState(previousValue !== null);

	const daysSelected = useMemo(() => getInclusiveDifferenceInDays(draftValue.start, draftValue.end), [draftValue.end, draftValue.start]);
	const daysPreviousSelected = useMemo(() => (draftPreviousValue ? getInclusiveDifferenceInDays(draftPreviousValue.start, draftPreviousValue.end) : 0), [draftPreviousValue]);

	const isInvalidRange = daysSelected <= 0 || daysSelected > maxDays;
	const isInvalidPreviousRange = draftPreviousValue ? daysPreviousSelected <= 0 || daysPreviousSelected > maxDays : false;

	const currentPreset = useMemo(() => presets.find((preset) => preset.range.start === value.start && preset.range.end === value.end), [presets, value.end, value.start]);

	const yearOptions = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
	}, []);

	useEffect(() => {
		function handlePointerDown(event: MouseEvent) {
			if (!rootRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handlePointerDown);
		}

		return () => {
			document.removeEventListener('mousedown', handlePointerDown);
		};
	}, [isOpen]);

	function openPicker() {
		setDraftValue(value);
		setDraftPreviousValue(previousValue);
		setIsComparisonMode(previousValue !== null);
		setIsOpen(true);
	}

	function shiftMonth(target: 'start' | 'end', step: number, isPrevious: boolean = false) {
		if (isPrevious) {
			if (!draftPreviousValue) return;

			const parts = target === 'start' ? parseDateParts(draftPreviousValue.start) : parseDateParts(draftPreviousValue.end);
			const shifted = new Date(parts.year, parts.month - 1 + step, 1);
			const nextDay = target === 'start' ? 1 : new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
			const nextValue = formatDateFromParts(shifted.getFullYear(), shifted.getMonth() + 1, nextDay);

			setDraftPreviousValue((current) => {
				if (!current) return null;
				return { ...current, [target]: nextValue };
			});
		} else {
			if (!draftValue) return;

			const parts = target === 'start' ? parseDateParts(draftValue.start) : parseDateParts(draftValue.end);
			const shifted = new Date(parts.year, parts.month - 1 + step, 1);
			const nextDay = target === 'start' ? 1 : new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
			const nextValue = formatDateFromParts(shifted.getFullYear(), shifted.getMonth() + 1, nextDay);

			setDraftValue((current) => ({ ...current, [target]: nextValue }));
		}
	}

	function handleToggleComparison(checked: boolean) {
		setIsComparisonMode(checked);
		if (!checked) {
			setDraftPreviousValue(null);
		} else if (!draftPreviousValue) {
			// Auto-generate previous period with same length
			const length = getInclusiveDifferenceInDays(draftValue.start, draftValue.end);
			const startDate = new Date(`${draftValue.start}T00:00:00`);
			const newEnd = new Date(startDate);
			newEnd.setDate(newEnd.getDate() - 1);
			const newStart = new Date(newEnd);
			newStart.setDate(newStart.getDate() - length + 1);

			setDraftPreviousValue({
				start: newStart.toISOString().slice(0, 10),
				end: newEnd.toISOString().slice(0, 10),
			});
		}
	}

	return (
		<div ref={rootRef} className="relative w-full sm:w-auto">
			<button
				type="button"
				onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
				className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-accent/20 hover:text-accent sm:min-w-[240px] sm:w-auto"
			>
				<span className="inline-flex items-center gap-2 truncate">
					<CalendarRange className="h-4 w-4 shrink-0" />
					<span className="truncate">
						{currentPreset ? translateDashboardPresetLabel(currentPreset.id, currentPreset.label, t) : `${formatDisplayDate(value.start)} a ${formatDisplayDate(value.end)}`}
					</span>
				</span>
				{previousValue ? (
					<span className="hidden max-w-[180px] truncate rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-slate-500 sm:inline-flex">
						{formatDisplayDate(previousValue.start)} a {formatDisplayDate(previousValue.end)}
					</span>
				) : null}
				<ChevronDown className={['h-4 w-4 shrink-0 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')} />
			</button>

			{isOpen ? (
				<div
					className={[
						'absolute top-12 z-50 w-[min(92vw,420px)] rounded-[1.5rem] border border-line bg-surface p-4 shadow-2xl sm:w-[420px]',
						align === 'right' ? 'right-0 max-sm:left-1/2 max-sm:-translate-x-1/2' : 'left-0',
					].join(' ')}
				>
					<div className="mb-4">
						<p className="text-sm font-bold text-slate-950">{t('dashboard.dateRange.title', 'Periodo')}</p>
						<p className="text-xs leading-5 text-slate-500">{t('dashboard.dateRange.subtitle', 'Selecione um intervalo de ate {{maxDays}} dias.', { maxDays })}</p>
					</div>

					<div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/30">
						<button
							type="button"
							onClick={() => handleToggleComparison(!isComparisonMode)}
							className={['relative inline-flex h-6 w-11 items-center rounded-full transition-all', isComparisonMode ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600'].join(' ')}
							aria-label={t('dashboard.dateRange.compareWithPrevious', 'Comparar com período anterior')}
						>
							<span
								className={[
									'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200',
									isComparisonMode ? 'translate-x-5' : 'translate-x-0.5',
								].join(' ')}
							/>
						</button>
						<label className="flex-1 cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-300">
							{t('dashboard.dateRange.compareWithPrevious', 'Comparar com período anterior')}
						</label>
					</div>

					<div className="mt-4 grid gap-3">
						<div>
							<div className="grid gap-3">
								{(['start', 'end'] as const).map((target) => {
									const label = target === 'start' ? t('dashboard.dateRange.start', 'Inicio') : t('dashboard.dateRange.end', 'Fim');
									return (
										<DateRangeSection
											key={`current-${target}`}
											label={label}
											value={draftValue[target]}
											onChange={(newValue) => setDraftValue((current) => ({ ...current, [target]: newValue }))}
											onShiftMonth={(step) => shiftMonth(target, step, false)}
											locale={locale}
											yearOptions={yearOptions}
										/>
									);
								})}
							</div>
						</div>

						{isComparisonMode && draftPreviousValue ? (
							<div className="rounded-[1rem] bg-app-pane-muted p-3">
								<div className="mb-2 flex items-center gap-2">
									<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{t('dashboard.dateRange.previousPeriod', 'Período Anterior')}</p>
									<button
										type="button"
										onClick={() => handleToggleComparison(false)}
										className="inline-flex h-4 w-4 items-center justify-center rounded text-slate-500 transition hover:text-slate-700"
										title={t('dashboard.dateRange.compareWithPrevious', 'Desativar comparação')}
									>
										<ChevronDown className="h-3.5 w-3.5 rotate-180" />
									</button>
								</div>
								<div className="grid gap-3">
									{(['start', 'end'] as const).map((target) => {
										const label = target === 'start' ? t('dashboard.dateRange.start', 'Inicio') : t('dashboard.dateRange.end', 'Fim');
										return (
											<DateRangeSection
												key={`previous-${target}`}
												label={label}
												value={draftPreviousValue[target]}
												onChange={(newValue) => setDraftPreviousValue((current) => (current ? { ...current, [target]: newValue } : null))}
												onShiftMonth={(step) => shiftMonth(target, step, true)}
												locale={locale}
												yearOptions={yearOptions}
											/>
										);
									})}
								</div>
							</div>
						) : null}
					</div>

					<div className="mt-3 flex flex-wrap items-center gap-2">
						<span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold text-accent">
							{daysSelected > 0 ? t('dashboard.dateRange.days', '{{count}} dias', { count: daysSelected }) : t('dashboard.dateRange.invalidPeriod', 'Periodo invalido')}
						</span>
						{isComparisonMode && draftPreviousValue ? (
							<span className="rounded-full bg-app-pane-muted px-3 py-1 text-[11px] font-semibold text-slate-500">
								{daysPreviousSelected > 0
									? t('dashboard.dateRange.daysComparison', '{{count}} dias (anterior)', { count: daysPreviousSelected })
									: t('dashboard.dateRange.invalidPeriod', 'Periodo invalido')}
							</span>
						) : null}
						{isInvalidRange ? (
							<span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-200">
								{t('dashboard.dateRange.invalidRange', 'O intervalo precisa ficar entre 1 e {{maxDays}} dias.', { maxDays })}
							</span>
						) : null}
						{isInvalidPreviousRange ? (
							<span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-200">
								{t('dashboard.dateRange.invalidRangeComparison', 'O período anterior também deve ficar entre 1 e {{maxDays}} dias.', { maxDays })}
							</span>
						) : null}
					</div>

					<div className="mt-4 flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="rounded-full border border-line px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/20 hover:text-accent"
						>
							{t('common.cancel')}
						</button>
						<button
							type="button"
							disabled={isInvalidRange || isInvalidPreviousRange}
							onClick={() => {
								onChange(draftValue);
								onPreviousChange(isComparisonMode ? draftPreviousValue : null);
								setIsOpen(false);
							}}
							className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{t('dashboard.dateRange.applyPeriod', 'Aplicar periodo')}
						</button>
					</div>
				</div>
			) : null}
		</div>
	);
}
