import { SectionPath } from '@renderer/data/types/web'
import { atom } from 'jotai'

export const activeSectionAtom = atom<SectionPath | null>(null)
