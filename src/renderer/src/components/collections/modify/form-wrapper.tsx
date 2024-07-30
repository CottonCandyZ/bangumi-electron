import AddSubjectCollectionForm from '@renderer/components/collections/modify/add-form'
import ModifySubjectCollectionForm from '@renderer/components/collections/modify/modify-form'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
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

export default function FormWrapper({ info }: { info: Add | Modify }) {
  if (isAdd(info)) {
    return (
      <AddSubjectCollectionForm
        collectionType={info.collectionType}
        subjectInfo={info.subjectInfo}
      />
    )
  } else {
    return <ModifySubjectCollectionForm collectionData={info.collectionData} />
  }
}
