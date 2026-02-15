import type { FamilyPerson } from '@/types'

interface PersonAvatarProps {
  person: FamilyPerson
  size?: number       // px, default 32
  className?: string
}

export default function PersonAvatar({ person, size = 32, className = '' }: PersonAvatarProps) {
  const fontSize = size * 0.55

  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt={person.name}
        className={`rounded-full object-cover border-2 shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          borderColor: person.color,
        }}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center border-2 shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize,
        borderColor: person.color,
        backgroundColor: `${person.color}15`,
      }}
    >
      {person.emoji}
    </div>
  )
}
