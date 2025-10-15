import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// 示例：如何测试一个简单的组件
const ExampleComponent = ({ title, onClick }) => {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onClick}>Click me</button>
    </div>
  )
}

describe('ExampleComponent', () => {
  it('renders with correct title', () => {
    render(<ExampleComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls onClick when button is clicked', () => {
    const mockOnClick = vi.fn()
    render(<ExampleComponent title="Test" onClick={mockOnClick} />)
    
    const button = screen.getByText('Click me')
    fireEvent.click(button)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})

// 示例：如何测试异步操作
describe('Async operations', () => {
  it('handles async operations', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: 'test' })
      })
    )
    
    global.fetch = mockFetch
    
    // 这里可以测试异步组件
    expect(mockFetch).toBeDefined()
  })
}) 