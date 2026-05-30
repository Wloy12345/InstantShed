export function StockLengthInput({
  label,
  value,
  onChange,
  disabled,
  unit = 'ft',
  step = 0.5,
  presets = [8, 10, 12, 16],
  presetLabels,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  unit?: string
  step?: number
  presets?: number[]
  presetLabels?: string[]
}) {
  return (
    <div className="field stock-length-field">
      <label className="field">
        <span>
          {label} ({unit})
        </span>
        <input
          type="number"
          min={0.1}
          step={step}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
      </label>
      <div className="preset-chips">
        {presets.map((len, i) => (
          <button
            key={len}
            type="button"
            className="chip"
            disabled={disabled}
            onClick={() => onChange(len)}
          >
            {presetLabels?.[i] ?? `${len}`}
          </button>
        ))}
      </div>
    </div>
  )
}
