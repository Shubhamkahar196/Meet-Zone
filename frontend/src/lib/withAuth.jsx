import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom"


const withAuth = (WrappedComponent) =>{
    const AuthComponent = (props)=>{
        const router = useNavigate();
        const [loading,setLoading] = useState(true);

         useEffect(()=>{
            const token = localStorage.getItem('token');

            if(!token){
                router("/auth",{replace:true});
            }else{
                setLoading(false);
            }
         },[router])

         if(loading) return <div className="h-screen flex item-center justify-center">Loading...</div>
         return <WrappedComponent {...props}/>
    };
    return AuthComponent;
    
}

export default withAuth;