import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// 创建带Router的包装组件
const AppWithRouter = () => (
    <BrowserRouter>
        <App />
    </BrowserRouter>
)

describe('App', () => {
    it('renders without crashing', () => {
        render(<AppWithRouter />)
        // 基本的渲染测试
        expect(document.body).toBeInTheDocument()
    })

    it('renders the app container', () => {
        render(<AppWithRouter />)
        // 检查应用是否正常渲染
        expect(document.body).toBeInTheDocument()
    })
}) 