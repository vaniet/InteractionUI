import React from 'react';
import './component/commonStyles.css';
import LoginForm from './component/LoginForm';
import RegisterForm from './component/RegisterForm';
import { Route, Routes } from "react-router-dom";
import MainPage from "./component/MainPage.jsx";
import CreateSeries from "./component/CreateSeries.jsx";
import Series from "./component/Series.jsx";
import EditSeries from "./component/EditSeries.jsx";
import Dashboard from "./component/Dashboard.jsx";
import OrderDetails from "./component/OrderDetails.jsx";
import ManageOrders from "./component/ManageOrders.jsx";
import PlayerShow from "./component/PlayerShow.jsx";
import BlindBoxShowcase from "./component/BlindBoxShowcase.jsx";
import Header from "./component/Header.jsx";
import { UserProvider } from './contexts/UserContext';

const App = () => {
  return (
    <UserProvider>
      <div className="fullscreen-gradient-bg"></div>
      <Header />
      <div className="app-content" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/mainpage" element={<MainPage />} />
          <Route path="/createseries" element={<CreateSeries />} />
          <Route path="/series/:id" element={<Series />} />
          <Route path="/editseries" element={<EditSeries />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<OrderDetails />} />
          <Route path="/manageorders" element={<ManageOrders />} />
          <Route path="/playershow" element={<PlayerShow />} />
          <Route path="/showcase" element={<BlindBoxShowcase />} />
        </Routes>
      </div>
    </UserProvider>
  );
};

export default App;
