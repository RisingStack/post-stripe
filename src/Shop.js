import React, { Component } from 'react'
import { injectStripe, CardElement } from 'react-stripe-elements'
import PropTypes from 'prop-types'
import axios from 'axios'
// import qs from 'query-string-object'

// const stripeAuthHeader = {
//   'Content-Type': 'application/x-www-form-urlencoded',
//   'Authorization': `Bearer rk_test_Cta0Tyvtm5APY9rMpo1r5Y8N`
// }

const prices = {
  banana: 150,
  cucumber: 100
}

const skus = {
  banana: 1,
  cucumber: 2
}

class Shop extends Component {
  constructor(props) {
    super(props)
    this.state = {
      fetching: false,
      cart: {
        banana: 0,
        cucumber: 0
      },
      coupon: '',
      email: '',
      name: '',
      address : {
        line1: '',
        city: '',
        state: '',
        country: '',
        postal_code: ''
      }
    }
    this.handleCartChange = this.handleCartChange.bind(this)
    this.handleCartReset = this.handleCartReset.bind(this)
    this.handleAddressChange = this.handleAddressChange.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(evt) {
    evt.preventDefault()
    this.setState({[evt.target.name]: evt.target.value})
  }

  handleAddressChange(evt) {
    evt.preventDefault()
    const address = this.state.address
    address[evt.target.name] = evt.target.value
    this.setState({address})
  }

  handleCartChange(evt) {
    evt.preventDefault()
    const cart = this.state.cart
    cart[evt.target.name]+= parseInt(evt.target.value)
    this.setState({cart})
  }

  handleCartReset(evt) {
    evt.preventDefault()
    this.setState({cart:{banana: 0, cucumber: 0}})
  }

  handleSubmit(evt) {
    evt.preventDefault()
    this.setState({fetching: true})
    const state = this.state
    const cart = state.cart
    
    this.props.stripe.createToken({name: state.name}).then(({token}) => {
       /* //Simple Direct Charge//
        const price = cart.banana * prices.banana + cart.cucumber * prices.cucumber
        axios.post(`https://api.stripe.com/v1/charges`, 
        qs.stringify({
          source: token.id,
          amount: price,
          currency: 'usd'
        }),
        { headers: stripeAuthHeader })
        .then((resp) => {
          this.setState({fetching: false})
          alert(`Thank you for your purchase! You card has been charged with: ${(resp.data.amount / 100).toLocaleString('en-US', {style: 'currency', currency: 'usd'})}`)
        })
        .catch(error => {
          this.setState({fetching: false})
          console.log(error)
        })
      */

      const order = {
        currency: 'usd',
        items: Object.keys(cart).filter((name) => cart[name] > 0 ? true : false).map(name => {
          return {
            type: 'sku',
            parent: skus[name],
            quantity: cart[name]
          }
        }),
        email: state.email,
        shipping: {
          name: state.name,
          address: state.address
        }
      }

      if (state.coupon) {
        order.coupon = state.coupon
      }

      axios.post(`http://localhost:3001/api/shop/order`, {order, source: token.id})
      .then(() => {
        this.setState({fetching: false})
        alert(`Thank you for your purchase!`)
      })
      .catch(error => {
        this.setState({fetching: false})
        console.log(error)
      })
    }).catch(error => {
      this.setState({fetching: false})
      console.log(error)
    })
  }

  render () {
    const state = this.state
    const fetching = state.fetching
    const cart = state.cart
    const address = state.address
    const submittable = (cart.banana !== 0 || cart.cucumber !== 0) && state.email && state.name && address.line1 && address.city && address.state && address.country && address.postal_code
    return (
      <form onSubmit={this.handleSubmit} style={{width: '550px', margin: '20px', padding: '10px', border: '2px solid lightseagreen', borderRadius: '10px'}}>
        <div>
          Banana {(prices.banana / 100).toLocaleString('en-US', {style: 'currency', currency: 'usd'})}:
          <div>
            <button name="banana" value={1} onClick={this.handleCartChange}>+</button>
            <button name="banana" value={-1} onClick={this.handleCartChange} disabled={cart.banana <= 0}>-</button>
            {cart.banana}
          </div>
        </div>
        <div>
          Cucumber {(prices.cucumber / 100).toLocaleString('en-US', {style: 'currency', currency: 'usd'})}:
          <div>
            <button name="cucumber" value={1} onClick={this.handleCartChange}>+</button>
            <button name="cucumber" value={-1} onClick={this.handleCartChange} disabled={cart.cucumber <= 0}>-</button>
            {cart.cucumber}
          </div>
        </div>
        <button onClick={this.handleCartReset}>Reset Cart</button>
        <div style={{width: '450px', margin: '10px', padding: '5px', border: '2px solid green', borderRadius: '10px'}}>
          <CardElement style={{base: {fontSize: '18px'}}}/>
        </div>
        <div>Name: <input type="text" name="name" onChange={this.handleChange}/></div>
        <div>Email: <input  type="text" name="email" onChange={this.handleChange}/></div>
        <div>Address Line: <input  type="text" name="line1" onChange={this.handleAddressChange}/></div>
        <div>City: <input  type="text" name="city" onChange={this.handleAddressChange}/></div>
        <div>State: <input  type="text" name="state" onChange={this.handleAddressChange}/></div>
        <div>Country: <input  type="text" name="country" onChange={this.handleAddressChange}/></div>
        <div>Postal Code: <input  type="text" name="postal_code" onChange={this.handleAddressChange}/></div>
        <div>Coupon Code: <input  type="text" name="coupon" onChange={this.handleChange}/></div>
        {!fetching
          ? <button type="submit" disabled={!submittable}>Purchase</button>
          : 'Purchasing...'}
        Price: {((cart.banana * prices.banana + cart.cucumber * prices.cucumber) / 100).toLocaleString('en-US', {style: 'currency', currency: 'usd'})}
      </form>
    )
  }
}

Shop.propTypes = {
  stripe: PropTypes.shape({
    createToken: PropTypes.func.isRequired
  }).isRequired
}

export default injectStripe(Shop)
