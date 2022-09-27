import React, { Component } from 'react';
import smart_contract from '../abis/Lottery.json';
import Web3 from 'web3';
import Swal from 'sweetalert2';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Container, Spinner } from 'react-bootstrap';
import "../App.css";

import Navigation from './Navbar';
// import MyCarousel from './Carousel';

class Tokens extends Component {

  async componentDidMount() {
    document.title = "Tokens - Lucky Lottery"
    // 1. Carga de Web3
    await this.loadWeb3()
    // 2. Carga de datos de la Blockchain
    await this.loadBlockchainData()
    // 3. Actualización de las variables de la Blockchain
    await this.updateData();
  }

  // 1. Carga de Web3
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      //console.log('Accounts: ', accounts)
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('¡Deberías considerar usar Metamask!')
    }
  }

  // 2. Carga de datos de la Blockchain
  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Ganache -> 5777, Rinkeby -> 4, BSC -> 97
    const networkId = await web3.eth.net.getId()
    // console.log('networkid:', networkId)
    const networkData = smart_contract.networks[networkId]
    // console.log('NetworkData:', networkData)

    if (networkData) {
      const abi = smart_contract.abi
      // console.log('abi', abi)
      const address = networkData.address
      // console.log('address:', address)
      const contract = new web3.eth.Contract(abi, address)
      this.setState({ contract })
    } else {
      window.alert('¡El Smart Contract no se ha desplegado en la red!')
    }

    window.ethereum.on('chainChanged', (chainID) => {
      window.location.reload();
    });

    window.ethereum.on('accountsChanged', async function (accounts) {
      window.location.reload();
    });

  }

  async updateData() {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(1000);
    this._getOwner();
    this._getVariables();
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '0x0',
      loading: false,
      contract: null,
      errorMessage: "",
      tokensBalance: 'Loading...',
      tokensBalanceSC: 'Loading...',
      ethersBalanceSC: 'Loading...',
      prizePool: 'Loading...',
      NFTContractAddress: 'Loading...',
      lotteryContractAddress: 'Loading...',
      generatedTickets: [],
      players: []
    }
  }

  _getOwner = async () => {
    try {
      const _owner = await this.state.contract.methods.owner().call();
      this.setState({ owner: _owner});
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }


  _getVariables = async () => {
    try {
      const web3 = window.web3;
      const _tokensBalance = await this.state.contract.methods.tokensBalance(this.state.account).call()
      this.setState({tokensBalance: _tokensBalance + " Tokens" })
      const _prizePool = await this.state.contract.methods.prizePool().call()
      this.setState({prizePool: web3.utils.fromWei(_prizePool.toString(), 'ether') + " ETH" })
      const _tokensBalanceSC = await this.state.contract.methods.tokensBalanceSC().call()
      this.setState({tokensBalanceSC: _tokensBalanceSC + " Tokens" })
      const _ethersBalanceSC = await this.state.contract.methods.ethersBalanceSC().call()
      this.setState({ethersBalanceSC: web3.utils.fromWei(_ethersBalanceSC.toString(), 'ether') + " ETH" })
      const _NFTContractAddress = await this.state.contract.methods.NFTContract().call()
      this.setState({NFTContractAddress: _NFTContractAddress});
      const _lotteryContractAddress = await this.state.contract.methods.lotteryContract().call()
      this.setState({lotteryContractAddress: _lotteryContractAddress});
      const _players = await this.state.contract.methods.getPlayers().call()
      this.setState({players: _players});
      const _generatedTickets = await this.state.contract.methods.getGeneratedTickets().call()
      this.setState({generatedTickets: _generatedTickets});
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }

  _buyTokens = async (_amount) => {
    try {
      this.setState({ loading: true })
      const tokensPrice = _amount * 0.01
      const web3 = window.web3
      const ethers = web3.utils.toWei(tokensPrice.toString(), 'ether')
      await this.state.contract.methods.buyTokens(_amount).send({
        from: this.state.account,
        value: ethers
      })
      Swal.fire({
        icon: 'success',
        title: 'Tokens bought successfully!!',
        width: 800,
        padding: '3em',
        text: `You bought ${_amount} Tokens by ${(ethers / 10 ** 18).toFixed(2)} ETH`,
        backdrop: `
          rgba(15, 238, 168, 0.2)
          left top
          no-repeat
        `
      })
      this.updateData();
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }

  _returnTokens = async (_amount) => {
    try {
      // console.log('Devolución de tokens en ejecución...')
      this.setState({ loading: true })
      const tokensPrice = _amount * 0.01
      const web3 = window.web3
      const ethers = web3.utils.toWei(tokensPrice.toString(), 'ether')
      await this.state.contract.methods.returnTokens(_amount).send({
        from: this.state.account })
      Swal.fire({
        icon: 'warning',
        title: 'Tokens returned successfully!!',
        width: 800,
        padding: '3em',
        text: `You returned ${_amount} Tokens by ${(ethers / 10 ** 18).toFixed(2)} ETH`,
        backdrop: `
          rgba(15, 238, 168, 0.2)
          left top
          no-repeat
        `
      })
      this.updateData();
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    
    if (this.state.loading) return (
      <div>
        <Navigation account={this.state.account} /><br />
        <div  className='loading'>
          <Spinner animation='border' style={{ display: 'flex', margin: 12 }} />
          <p className='mx3 my-0'>Loading blockchain data, wait a moment please...</p>
        </div>
      </div>
    );

    return (
      <div>
        <Navigation account={this.state.account} />
        {/* <MyCarousel /> */}
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h1>ERC-20 Tokens Management</h1>
                &nbsp;
                <Container>
                  <Row>
                    <Col>
                      <h2>Balance</h2>
                      <h4>{this.state.tokensBalance}</h4>
                    </Col>
                    <Col>
                      <h2>Prize Pool</h2>
                      <h4>{this.state.prizePool}</h4>
                      {/* <form onSubmit={(event) => {
                        event.preventDefault()
                        this._ethersBalanceSC()
                      }}>
                        <input type='submit'
                          className='bbtn btn-block btn-danger btn-sm'
                          value='Get Lottery Prize' />
                      </form> */}
                    </Col>
                  </Row>
                  {/* &nbsp;
                  <Row>
                  <Col>
                      <h3>SC´s Tokens</h3>
                      <h4>{this.state.tokensBalanceSC}</h4>
                      <form onSubmit={(event) => {
                        event.preventDefault()
                        this._tokensBalanceSC()
                      }}>
                        <input type='submit'
                          className='bbtn btn-block btn-info btn-sm'
                          value='Get SC Tokens Balance' />
                      </form>
                    </Col>
                  </Row> */}
                  &nbsp;
                  <Row>
                    <Col>
                      <h3>Buy ERC20 Tokens</h3>
                      <form onSubmit={(event) => {
                        event.preventDefault()
                        const _amountBuy = this._amountBuy.value
                        this._buyTokens(_amountBuy)
                      }}>
                        <input type='number'
                          className='form-control mb-1'
                          placeholder='Tokens amount'
                          ref={(input) => this._amountBuy = input} />
                        <input type='submit'
                          className='bbtn btn-block btn-primary btn-sm'
                          value='Buy Tokens' />
                      </form>
                    </Col>
                    <Col>
                    <h3>Return ERC20 Tokens</h3>
                    <form onSubmit={(event) => {
                        event.preventDefault()
                        const _amountReturn = this._amountReturn.value
                        this._returnTokens(_amountReturn)
                      }}>
                        <input type='number'
                          className='form-control mb-1'
                          placeholder='Tokens amount'
                          ref={(input) => this._amountReturn = input} />
                        <input type='submit'
                          className='bbtn btn-block btn-warning btn-sm'
                          value='Return Tokens' />
                    </form>
                    </Col>
                  </Row><div className='center-container'>
                    { (this.state.owner === this.state.account) ? (<div><br />
                        <hr /><h4>Debug info</h4><hr />
                        <div>Smart Contract´s Tokens Balance: {this.state.tokensBalanceSC}</div>
                        <div>Smart Contract´s Ethers Balance: {this.state.ethersBalanceSC}</div>
                        <div>Lottery Contract Address: {this.state.lotteryContractAddress}</div>
                        <div>NFT Contract Address: {this.state.NFTContractAddress}</div>
                        <div>Current Players: {this.state.players.map((player) => (<>({player}) </>))}</div>
                        <div>Sold tickets: {this.state.generatedTickets.map((ticket) => (<>({ticket}) </>))}</div>
                        <hr />
                      </div>)
                      : ('')
                    }</div>
                </Container>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default Tokens;
