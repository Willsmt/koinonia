import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import profileReducer from '../features/auth/profileSlice'
import postsReducer from '../features/posts/postsSlice'
import churchReducer from '../features/church/churchSlice'
import likesReducer from '../features/interactions/likesSlice'
import commentsReducer from '../features/interactions/commentsSlice'
import followReducer from '../features/interactions/followSlice'
import peopleReducer from '../features/people/peopleSlice'
import reportsReducer from '../features/reports/reportsSlice'

export function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      profile: profileReducer,
      posts: postsReducer,
      church: churchReducer,
      likes: likesReducer,
      comments: commentsReducer,
      follow: followReducer,
      people: peopleReducer,
      reports: reportsReducer,
    },
  })
}
