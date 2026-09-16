/** Uses only the author already included in a list response; no profile query. */
export function AuthorLabel({ name, avatar }: { name: string; avatar?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={name}>
      {avatar && (
        <img
          key={avatar}
          src={avatar}
          alt=""
          loading="lazy"
          className="size-4 shrink-0 rounded-full object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      )}
      <span className="truncate">{name}</span>
    </span>
  )
}
