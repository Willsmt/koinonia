import zxcvbn from 'zxcvbn'

const LABELS = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte']
const COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-600']

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const { score } = zxcvbn(password)

  return (
    <div className="mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i <= score ? COLORS[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-500">{LABELS[score]}</p>
    </div>
  )
}
