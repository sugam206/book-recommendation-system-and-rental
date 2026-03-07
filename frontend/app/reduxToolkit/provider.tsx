'use client'

import { Provider } from "react-redux"
import { store } from "./store"

interface providerProps {
    children: React.ReactNode
}

export const Providers: React.FC<providerProps> = ({ children }) => {
    return <Provider store={store}>{children}</Provider>
}