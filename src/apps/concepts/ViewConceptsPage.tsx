import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
import { Fab, Grid } from '@material-ui/core'
import { ConceptsTable } from './components'
import { connect } from 'react-redux'
import { retrieveConceptsAction, viewConceptsLoadingSelector, viewConceptsErrorsSelector } from './redux'
import { AppState } from '../../redux'
import { APIConcept, OptionalQueryParams as QueryParams } from './types'
import { useLocation, useHistory, useParams } from 'react-router'
import { useQuery } from '../../utils'
import qs from 'qs'
import { ProgressOverlay } from '../../utils/components'
import FilterOptions from './components/FilterOptions'
import { Add as AddIcon } from '@material-ui/icons'
import { Link } from 'react-router-dom'
import { APIOrg, APIProfile, canModifyContainer, profileSelector } from '../authentication'
import { orgsSelector } from '../authentication/redux/reducer'
import { CIEL_CONCEPTS_URL, SOURCE_CONTAINER } from './constants'

interface Props {
  concepts?: APIConcept[],
  loading: boolean,
  errors?: {},
  retrieveConcepts: Function,
  meta?: { num_found?: number },
  profile?: APIProfile,
  usersOrgs?: APIOrg[],
  containerType: string,
}

const ViewConceptsPage: React.FC<Props> = ({ concepts, loading, errors, retrieveConcepts, meta = {}, profile, usersOrgs, containerType }) => {
  const { push: goTo } = useHistory()
  const { pathname: url } = useLocation()
  const {ownerType, owner}  = useParams<{ownerType: string, owner: string}>();

  const queryParams: QueryParams = useQuery() // todo get limit from settings
  const {
    page = 1,
    sortDirection = 'sortAsc',
    sortBy = 'id',
    limit = 25,
    q: initialQ = '',
    classFilters: initialClassFilters = [],
    dataTypeFilters: initialDataTypeFilters = [],
    collection,
  } = queryParams

  const [showOptions, setShowOptions] = useState(true)
  const [classFilters, setClassFilters] = useState<string[]>(initialClassFilters)
  const [dataTypeFilters, setInitialDataTypeFilters] = useState<string[]>(initialDataTypeFilters)
  const [q, setQ] = useState(initialQ)
  const canModifySource = canModifyContainer(ownerType, owner, profile, usersOrgs);

  const gimmeAUrl = (params: QueryParams) => {
    const newParams: QueryParams = {
      ...queryParams, ...{
        classFilters: classFilters,
        dataTypeFilters: dataTypeFilters,
        page: 1,
        q
      }, ...params
    }
    return `${url}?${qs.stringify(newParams)}`
  }

  useEffect(() => {
    retrieveConcepts(url, page, limit, initialQ, sortDirection, sortBy, initialDataTypeFilters, initialClassFilters)
  }, [retrieveConcepts, url, page, limit, initialQ, sortDirection, sortBy, initialDataTypeFilters.toString(), initialClassFilters.toString()])

  return (
    <>
      <Header title="Concepts" justifyChildren="space-around">
        <ProgressOverlay loading={loading}>
          <Grid id="viewConceptsPage" item xs={showOptions ? 9 : 12} component="div">
            <ConceptsTable
              concepts={concepts || []}
              buttons={{
                edit: canModifySource,
                addToCollection: !!collection,
              }}
              collection={collection}
              q={q}
              setQ={setQ}
              page={page}
              sortDirection={sortDirection}
              sortBy={sortBy}
              limit={Number(limit)}
              buildUrl={gimmeAUrl}
              goTo={goTo}
              count={meta.num_found ? Number(meta.num_found) : (concepts ? concepts.length : 0)}
              toggleShowOptions={() => setShowOptions(!showOptions)}
            />
          </Grid>
          {!showOptions ? '' : (
            <Grid item xs={2} component="div">
              <FilterOptions checkedClasses={classFilters} setCheckedClasses={setClassFilters}
                             checkedDataTypes={dataTypeFilters} setCheckedDataTypes={setInitialDataTypeFilters}
                             url={gimmeAUrl({})}/>
            </Grid>
          )}
        </ProgressOverlay>
      </Header>
      {!canModifySource ? null : (
        <Link to={containerType === SOURCE_CONTAINER ? `${url}new/` : `${CIEL_CONCEPTS_URL}?collection=${url}`}>
          <Fab color="primary" className="fab">
            <AddIcon/>
          </Fab>
        </Link>
      )}
    </>
  )
}

const mapStateToProps = (state: AppState) => ({
  profile: profileSelector(state),
  usersOrgs: orgsSelector(state),
  concepts: state.concepts.concepts ? state.concepts.concepts.items : undefined,
  meta: state.concepts.concepts ? state.concepts.concepts.responseMeta : undefined,
  loading: viewConceptsLoadingSelector(state),
  errors: viewConceptsErrorsSelector(state),
})

const mapActionsToProps = {
  retrieveConcepts: retrieveConceptsAction,
}

export default connect(mapStateToProps, mapActionsToProps)(ViewConceptsPage)
