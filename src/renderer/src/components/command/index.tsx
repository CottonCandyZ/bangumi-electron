// export function CommandMenu() {
//   const [open, setOpen] = React.useState(false)

//   React.useEffect(() => {
//     const down = (e: KeyboardEvent) => {
//       if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
//         e.preventDefault()
//         setOpen((open) => !open)
//       }
//     }
//     document.addEventListener("keydown", down)
//     return () => document.removeEventListener("keydown", down)
//   }, [])

//   return (
//     <CommandDialog open={open} onOpenChange={setOpen}>
//       <CommandInput placeholder="Type a command or search..." />
//       <CommandList>
//         <CommandEmpty>No results found.</CommandEmpty>
//         <CommandGroup heading="Suggestions">
//           <CommandItem>Calendar</CommandItem>
//           <CommandItem>Search Emoji</CommandItem>
//           <CommandItem>Calculator</CommandItem>
//         </CommandGroup>
//       </CommandList>
//     </CommandDialog>
//   )
// }
