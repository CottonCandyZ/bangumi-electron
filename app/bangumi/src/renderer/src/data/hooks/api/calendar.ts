import { getCalendar } from '@renderer/data/fetch/api/calendar'
import { useAuthQuery } from '@renderer/data/hooks/factory'

export const useCalendarQuery = () =>
  useAuthQuery({
    queryFn: getCalendar,
    queryKey: ['calendar-v1'],
    queryProps: {},
  })
