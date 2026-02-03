import withAuth from '@/lib/withAuth';
import React from 'react'
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const[meetingCode,setMeetingCode] = usestate("");
  
  const handleLoginVideoCall = async () => {
    navigate(`/${meetingCode}`);
  }
  return (
    <div>Dashboard</div>
  )
}

export default withAuth(Dashboard);