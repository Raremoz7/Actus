// Shim web do @react-native-community/datetimepicker.
// Renderiza um <input type="date|time"> nativo do navegador com a mesma forma de
// callback do picker RN: onChange(event, selectedDate).
import type { FC } from 'react';

type DTEvent = { type: 'set' | 'dismissed'; nativeEvent: { timestamp?: number } };

type Props = {
  value?: Date;
  mode?: 'date' | 'time' | 'datetime';
  display?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  onChange?: (event: DTEvent, date?: Date) => void;
  // props RN ignoradas na web
  themeVariant?: string;
  testID?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

const DateTimePicker: FC<Props> = ({ value, mode = 'date', maximumDate, minimumDate, onChange }) => {
  const type = mode === 'time' ? 'time' : 'date';
  const v = value ?? new Date();

  const inputValue =
    type === 'time'
      ? `${pad(v.getHours())}:${pad(v.getMinutes())}`
      : `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;

  const fmtDate = (d?: Date) =>
    d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : undefined;

  return (
    <input
      type={type}
      defaultValue={inputValue}
      min={type === 'date' ? fmtDate(minimumDate) : undefined}
      max={type === 'date' ? fmtDate(maximumDate) : undefined}
      style={{
        fontSize: 16,
        padding: 8,
        borderRadius: 8,
        border: '1px solid #333338',
        background: '#1C1C1F',
        color: '#F5F5F6',
        colorScheme: 'dark',
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (!raw) return onChange?.({ type: 'dismissed', nativeEvent: {} });
        let next: Date;
        if (type === 'time') {
          const [h, m] = raw.split(':').map(Number);
          next = value ? new Date(value) : new Date();
          next.setHours(h ?? 0, m ?? 0, 0, 0);
        } else {
          next = new Date(`${raw}T00:00:00`);
        }
        onChange?.({ type: 'set', nativeEvent: { timestamp: next.getTime() } }, next);
      }}
    />
  );
};

export default DateTimePicker;
