import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

export default function SearchFilterPanel() {
  return (
    <section className="flex flex-col p-2">
      <div>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>时间线</CardTitle>
          </CardHeader>
          <CardContent>
            <section>按月份选取</section>
            <section>按确定选取</section>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
