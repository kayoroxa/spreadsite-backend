import { I_CodeLanguage } from './../../src/utils/@types/projectTypes'
import axios from 'axios'
import { action, Action, thunk, Thunk, thunkOn, ThunkOn } from 'easy-peasy'
import { I_Page, I_Project } from '../../src/utils/@types/projectTypes'
import getNewLayout from '../../src/utils/getNewLayout'
import replacePatterns from '../../src/utils/replacePatterns'

type MyActionPrev<T> = T | ((prev: T) => T)
export interface ProjectModel {
  data: {
    name: string | null
    pages: I_Page[]
  }
  currentPageName: string | null
  currentPageIndex: number | null
  setCurrentPageName: Action<ProjectModel, string>
  setCurrentPageIndex: Action<ProjectModel, number>

  isSaved: boolean
  setIsSaved: Action<ProjectModel, MyActionPrev<boolean>>

  loadProject: Action<ProjectModel, I_Project>
  setProject: Action<ProjectModel, MyActionPrev<I_Project>>
  onSetProject: ThunkOn<ProjectModel, MyActionPrev<I_Project>>
  saveProjectInDb: Thunk<ProjectModel>

  addLayout: Action<ProjectModel>
  duplicateLayout: Action<ProjectModel, number | null>
  resetLayout: Action<ProjectModel>
  deleteCell: Action<ProjectModel, number>

  setCode: Action<
    ProjectModel,
    { index: number; code: string; language: I_CodeLanguage }
  >

  replaceCode: Action<
    ProjectModel,
    {
      index: number
      input: string
      // replacement: string
      language: I_CodeLanguage
    }
  >
}

const project: ProjectModel = {
  data: {
    name: null,
    pages: [],
  },
  currentPageName: null,
  setCurrentPageName: action((state, payload) => {
    state.currentPageName = payload
  }),

  currentPageIndex: null,
  setCurrentPageIndex: action((state, payload) => {
    state.currentPageIndex = payload
  }),

  isSaved: true,
  setIsSaved: action((state, payload) => {
    if (typeof payload === 'function') {
      state.isSaved = payload(state.isSaved)
    } else {
      state.isSaved = payload
    }
  }),
  loadProject: action((state, payload) => {
    state.data.name = payload.name
    state.data.pages = payload.pages
  }),
  setProject: action((state, payload) => {
    if (typeof payload === 'function') {
      state.data = payload(state.data)
    } else {
      state.data = payload
    }
  }),
  onSetProject: thunkOn(
    actions => actions.setProject,
    async actions => {
      actions.setIsSaved(false)
    }
  ),

  setCode: action((state, { language, index, code }) => {
    if (state.currentPageIndex === null) return
    state.data.pages[state.currentPageIndex].cells[index] = {
      ...state.data.pages[state.currentPageIndex].cells[index],
      [language]: code,
    }
  }),

  replaceCode: action((state, { index, input, language }) => {
    if (state.currentPageIndex === null) return
    state.data.pages[state.currentPageIndex].cells[index] = {
      ...state.data.pages[state.currentPageIndex].cells[index],
      [language]: replacePatterns(
        input,
        state.data.pages[state.currentPageIndex].cells[index].code[language]
      ),
    }
  }),

  saveProjectInDb: thunk(async (actions, _, { getState }) => {
    const endPoint = 'http://localhost:3000/api/projects/'
    // const endPoint = process.env.END_POINT
    //   ? process.env.END_POINT
    //   : 'https://spreadsite.vercel.app/api/projects/'

    const project = getState()
    actions.setIsSaved(true)
    const response = await axios.put(endPoint + project.data.name, project.data)
    console.log({ response })
  }),

  addLayout: action(state => {
    if (state.currentPageIndex === null) return
    state.data.pages[state.currentPageIndex].cells.push(
      getNewLayout(state.data.pages, state.currentPageIndex)
    )
  }),

  duplicateLayout: action((state, indexCell) => {
    if (state.currentPageIndex === null || indexCell === null) return
    const newLayout = state.data.pages[state.currentPageIndex].cells[indexCell]
    state.data.pages[state.currentPageIndex].cells.push(newLayout)
  }),

  resetLayout: action(state => {
    if (state.currentPageIndex === null) return
    state.data.pages[state.currentPageIndex].cells = []
  }),
  deleteCell: action((state, payload) => {
    if (state.currentPageIndex === null) return
    state.data.pages[state.currentPageIndex].cells.splice(payload, 1)
  }),
}

export default project
