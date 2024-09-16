import { Actor } from '@renderer/data/types/character'
import { Fragment } from 'react/jsx-runtime'

export function Actors({ actors }: { actors: Actor[] }) {
  let first = true
  return (
    <div className="inline-flex flex-row flex-wrap gap-0.5">
      {actors.map((actor) => {
        if (first) {
          first = false
          return <span key={actor.id}>{actor.name}</span>
        }
        return (
          <Fragment key={`${actor.id}-fra`}>
            <span key={actor.id}>/ {actor.name}</span>
          </Fragment>
        )
      })}
    </div>
  )
}
