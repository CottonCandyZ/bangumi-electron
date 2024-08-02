import AddOrModifySubjectCollectionForm from '@renderer/components/collections/modify/form/form'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { ModifyCollectionOptType } from '@renderer/data/types/modify'
import { Subject } from '@renderer/data/types/subject'

type Add = {
  subjectInfo: Subject
  collectionType: CollectionType
}
type Modify = {
  collectionData: CollectionData
}
function isAdd(episodes: Add | Modify): episodes is Add {
  return (episodes as Add).subjectInfo !== undefined
}

export default function FormWrapper({
  info,
  username,
  accessToken,
  setOpen,
}: {
  info: Add | Modify
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
} & ModifyCollectionOptType) {
  if (isAdd(info)) {
    const { subjectInfo } = info
    return (
      <AddOrModifySubjectCollectionForm
        subjectId={subjectInfo.id.toString()}
        collectionType={info.collectionType}
        subjectType={subjectInfo.type}
        subjectTags={subjectInfo.tags}
        username={username}
        accessToken={accessToken}
        setOpen={setOpen}
      />
    )
  } else {
    const { collectionData } = info
    return (
      <AddOrModifySubjectCollectionForm
        subjectId={collectionData.subject_id.toString()}
        collectionType={collectionData.type}
        subjectType={collectionData.subject_type}
        comment={collectionData.comment ?? ''}
        rate={collectionData.rate}
        isPrivate={collectionData.private}
        tags={collectionData.tags}
        subjectTags={collectionData.subject.tags}
        username={username}
        accessToken={accessToken}
        setOpen={setOpen}
        modify
      />
    )
  }
}
