import React, { Component } from 'react'
import Web3 from 'web3'
import {BrowserRouter as Router} from 'react-router-dom'
import Tipogram from './abis/Tipogram.json'
import Navbar from './components/Navbar'
import Main from './components/Main'

const IPFS = require('ipfs-http-client');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
class App extends Component {
  constructor(props){
    super(props)
    this.state={ 
        account:'',
        tipogram:null,
        imageCount:0,
        images:[],
        loading:true,
        hash:''
    }
  }

async componentDidMount(){
  await this.loadWeb3()
  await this.loadBlockchainData()
}

  async loadWeb3(){
    if(window.ethereum){
        window.web3=new Web3(window.ethereum)
        
            //request account access if needed
        await window.ethereum.enable()
        
    }
    else if(window.web3){
        window.web3=new Web3(window.web3.currentProvider)
        
    }
    else{
        window.alert('Non ethereum browser detected.You should consider trying Metamask')
    }   
}

  async loadBlockchainData(){
    const web3=window.web3
    const accounts=await web3.eth.getAccounts()
    this.setState({account:accounts[0]})
    const networkId=await web3.eth.net.getId()
    const networkData=Tipogram.networks[networkId]
    if(networkData){
      const tipogram= new web3.eth.Contract(Tipogram.abi,networkData.address)                
      this.setState({tipogram:tipogram})
      const imageCount=await tipogram.methods.imageCount().call()
      console.log(imageCount)
      for(var i=1;i<=imageCount;i++){
        const image=await tipogram.methods.images(i).call()
        this.setState({
          images:[...this.state.images,image]
        })
      }
      this.setState({loading:false})
    }
    else{
      window.alert("Please check your metamask account")
    }
  }
  captureFile=e=>{
    e.preventDefault()
    const file=e.target.files[0]
    const reader=new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend=()=>{
      this.setState({buffer:Buffer(reader.result)})
      console.log('buffer',this.state.buffer)
    }
  }
  uploadImage=description=>{
    console.log('Submitting file to IPFS')
    ipfs.add(this.state.buffer,(error,result)=>{
      if(error){
        console.error(error)
        return
      }

      this.setState({loading:true})
      this.state.tipogram.methods.uploadImage(result[0].hash,description).send({from:this.state.account}).on('transactionhash',(hash)=>{
        this.setState({loading:false})
      })
    })
  }
  tipImage=(id,tipAmount)=>{
    this.setState({loading:true})
    this.state.tipogram.methods.tipImage(id).send({from:this.state.account,value:tipAmount}).on('transactionhash',(hash)=>{
      this.setState({loading:false})
    })
  }

  render() {
    return (
      <Router>
        <div>
      <Navbar account={this.state.account}/>
      {this.state.loading?<div className="text-center mt-5"><p className="text-center text-primary">Loading...</p></div>:<Main captureFile={this.captureFile} uploadImage={this.uploadImage} images={this.state.images} tipImage={this.tipImage}/>}
      </div>
      </Router>
      
    )
  }
}
export default App