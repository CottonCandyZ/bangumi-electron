1. 使用 src/renderer/src/components/ui/command.tsx
2. 创建对 db 的搜索，其实主要是对中文名的搜索，如果能支持别的更好
3. 搜不到的 fallback 到搜索页面选项
4. command / ctrl + k 直接搜索对应的条目
5. command / ctrl + p 是打开 command panel
6. 需要将 command 组件写在一个 module 并注册到全局 wrapper 里。
7. 寻找一个合适的搜索方案，你可以在这里 src/renderer/src/data/fetch/db 看到现在查找数据的方案，但是搜索可能要用更好的方案。
