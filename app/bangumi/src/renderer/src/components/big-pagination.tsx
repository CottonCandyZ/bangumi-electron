import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@renderer/components/ui/pagination'

export function BigPagination({
  value,
  onValueChanged,
  total,
}: {
  total: number
  value: number
  onValueChanged: (value: number) => void
}) {
  const setPage = (nextValue: number) => {
    if (nextValue < 1 || nextValue > total || nextValue === value) return
    onValueChanged(nextValue)
  }

  if (total < 10)
    return (
      <Pagination>
        <PaginationContent>
          {/* 上一页 */}
          <PaginationItem>
            <PaginationPrevious disabled={value === 1} onClick={() => setPage(value - 1)} />
          </PaginationItem>
          {Array(total)
            .fill(0)
            .map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink isActive={value === index + 1} onClick={() => setPage(index + 1)}>
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          {/* 下一页 */}
          <PaginationItem>
            <PaginationNext disabled={value === total} onClick={() => setPage(value + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  return (
    <Pagination>
      <PaginationContent>
        {/* 上一页 */}
        <PaginationItem>
          <PaginationPrevious disabled={value === 1} onClick={() => setPage(value - 1)} />
        </PaginationItem>

        {/* 第一页 */}
        <PaginationItem>
          <PaginationLink isActive={value === 1} onClick={() => setPage(1)}>
            1
          </PaginationLink>
        </PaginationItem>
        {/* 省略号 */}
        {value - 2 > 3 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {/* 头部 */}
        {value < 6
          ? Array(6)
              .fill(0)
              .map((_, index) => {
                return (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={value === index + 2}
                      onClick={() => setPage(index + 2)}
                    >
                      {index + 2}
                    </PaginationLink>
                  </PaginationItem>
                )
              })
          : total - value - 1 < 4
            ? // 中部
              Array(6)
                .fill(0)
                .map((_, index) => {
                  return (
                    <PaginationItem key={total + index - 6}>
                      <PaginationLink
                        isActive={value === total + index - 6}
                        onClick={() => setPage(total + index - 6)}
                      >
                        {total + index - 6}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })
            : // 尾部
              Array(5)
                .fill(0)
                .map((_, index) => {
                  return (
                    <PaginationItem key={value + index - 2}>
                      <PaginationLink
                        isActive={value === value + index - 2}
                        onClick={() => setPage(value + index - 2)}
                      >
                        {value + index - 2}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
        {/* 省略号 */}
        {total - value - 1 > 3 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {/* 最后一页 */}
        <PaginationItem>
          <PaginationLink isActive={value === total} onClick={() => setPage(total)}>
            {total}
          </PaginationLink>
        </PaginationItem>
        {/* 下一页 */}
        <PaginationItem>
          <PaginationNext disabled={value === total} onClick={() => setPage(value + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
