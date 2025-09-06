import React from 'react'
import { render } from '@testing-library/react'

// 自定义渲染函数，包含常用的RM providers
const AllTheProviders = ({ children }) => {
    return (
        <>
            {children}
        </>
    )
}

const customRender = (ui, options = {}) =>
    render(ui, { wrapper: AllTheProviders, ...options })

// 重新导出所有内容
export * from '@testing-library/react'

// 覆盖默认的render方法
export { customRender as render } 