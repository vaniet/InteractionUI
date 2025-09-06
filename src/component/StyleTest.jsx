import React, { useState } from 'react';
import './commonStyles.css';

export default function StyleTest() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="container gradient-bg">
      <div className="card">
        <h2 className="title pulse-animation">样式测试组件</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="testInput">测试输入框</label>
            <input
              type="text"
              id="testInput"
              className="input-field"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入内容"
            />
          </div>
          <button type="submit" className="button">提交</button>
        </form>
        {isSubmitted && (
          <div className="card" style={{ marginTop: '20px' }}>
            <p>您输入的内容是: {inputValue}</p>
          </div>
        )}
      </div>
    </div>
  );
}