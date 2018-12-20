# Creating Simple Webshop With Stripe

In this article, we’ll create a simple webshop using Stripe, React and Express.
We'll get familiar with the Stripe Dashboard and basic Stripe features such as charges, customers, orders, coupons and so on. Also we will understand the usage of webhooks and restricted API keys.

The example app's frontend can be found at https://github.com/RisingStack/post-stripe its backend at https://github.com/RisingStack/post-stripe-api

## Stripe

First of all, what is Stripe? It is basically a payment provider: you setup your account, integrate it into your application pretty easily and let the money rain. Pretty simple right? Well, let your finance people tell if it is a good provider or not based on the plans they offer. If you are here, you probably are probably more interested in the technicalities of the integration. So let's build a simple demo application with Stripe. 

![Make it rain](https://media.giphy.com/media/3Jhdg8Qro5kMo/giphy.gif)

Before we start coding, lets create a Stripe account. Don't worry, no credit card is required for now, you only need to provide a payment method when you want to _activate_ your account need to provide a payment method. So you can use it outside of test instance to play around first. Go stratight to [Stripe Dashboard](https://dashboard.stripe.com/login) and hit that **Sign up** button. Email, name, password... the usual. **BOOM!** You have a dashboard. You can create, manage and keep track of orders, payment flow, customers... so basically everything you want to know regarding your shop here. If you want to create a new coupon or product for instance, you only need to click a few buttons, or enter a simple curl command in your terminal described in the [Stripe API Doc](https://stripe.com/docs/api), and of course you can integrate it into your product so your admins can set them up from your UI integrate and expose it to your customuers using [Stripe.js](https://github.com/stripe/stripe-node). Another important menu on the dashboard is **_Developers_**, where we will add our first _webhook_ and create our _restricted API keys_. We will get more familiar with the dashboard and the API while we implement our demo shop below.

![Dashboard](./images/dashboard.png)

## Webshop with Charges

Lets create a React webshop with two products: Banana and Cucumber. What else would you want to buy in a webshop anyway, right? We can use [Create React App](https://github.com/facebook/create-react-app) to get started. We're going to use [Axios](https://github.com/axios/axios) for HTTP requests and [query-string-object](https://www.npmjs.com/package/query-string-object) to convert objects to query strings for Stripe requests. We will also need [React Stripe Elements](https://github.com/stripe/react-stripe-elements), which is a React wrapper for Stripe.js and Stripe Elements, it adds secure credit card inputs and sends the card's data for tokenization to the Stripe API. *You should never send raw credit card details to your own API, but let Stripe handle the credit card security for you*. You will be able to identify the card provided by the user using the token you got from Stripe.

```
npx create-react-app webshop
cd webshop
npm install --save react-stripe-elements
npm install --save axios
npm install --save query-string-object
```

After the preparations are done, we have to include Stripe.js in our application. Just add `<script src="https://js.stripe.com/v3/"></script>` to the head of your `index.html`.
Now we are ready to start coding. First we have to add a `<StripeProvider/>` from `react-stripe-elements` to our root React App component. This will give us access to the [Stripe object](https://stripe.com/docs/stripe-js/reference#the-stripe-object), in the props we should pass a public access key (`apiKey`) which is found in the dashboard's _Developers_ section under the _API keys_ menu as _Publishable key_.

![DashboardApiKey](./images/dashboard_api-key.png)

```javascript
// App.js
import React from 'react'
import {StripeProvider, Elements} from 'react-stripe-elements'
import Shop from './Shop'

const App = () => {
  return (
    <StripeProvider apiKey="pk_test_xxxxxxxxxxxxxxxxxxxxxxxx">
      <Elements>
        <Shop/>
      </Elements>
    </StripeProvider>
  )
}

export default App
```

The `<Shop/>` is the implementation of our shop form as you can see from `import Shop from './Shop'`. We'll go into it's details later. As you can see the `<Shop/>` is warppend in `<Elements>` imported from `react-stripe-elements` so that you can use `injectStripe` in your components. To shed some light on this, let's take a look at our implementation in `Shop.js`. 

```javascript
// Shop.js
import React, { Component } from 'react'
import { CardElement } from 'react-stripe-elements'
import PropTypes from 'prop-types'
import axios from 'axios'
import qs from 'query-string-object'

const prices = {
  banana: 150,
  cucumber: 100
}

class Shop extends Component {
  constructor(props) {
    super(props)
    this.state = {
      fetching: false,
      cart: {
        banana: 0,
        cucumber: 0
      }
    }
    this.handleCartChange = this.handleCartChange.bind(this)
    this.handleCartReset = this.handleCartReset.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
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
    // TODO
  }

  render () {
    const cart = this.state.cart
    const fetching = this.state.fetching
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
        {!fetching
          ? <button type="submit" disabled={cart.banana === 0 && cart.cucumber === 0}>Purchase</button>
          : 'Purchasing...'
        }
        Price:{((cart.banana * prices.banana + cart.cucumber * prices.cucumber) / 100).toLocaleString('en-US', {style: 'currency', currency: 'usd'})}
      </form>
    )
  }
}

Shop.propTypes = {
  stripe: PropTypes.shape({
    createToken: PropTypes.func.isRequired
  }).isRequired
}
```

If you take a look at it, the `Shop` is a simple React form, with to purchasable elements: `Banana` and `Cucumber`, with a qunatity increase and decrease button for each. Clicking the buttons will change their respective amount in `this.state.cart`. There is a `submit` button below, and the current total price of the cart is printed at the very bottom of the form. Price will expect the prices in cents, so we store them as cents, but of course we want to present them to the user in dollars. We prefer them to be shown to the second decimal place, eg. $2.50 instead of $2.5. To achieve this, we can use the built in `toLocaleString()` function to format the prices. 

Now comes the stripe specific part: we need to add a form element so users can enter their cart details. To achieve this, we only need to add `<CardElment/>` from `react-stripe-elements` and that's it. I've also added a bit of low effort inline css to make this shop at least somewhat pleasing to the eye.

We also need to use `injectStripe` [Higher-Order-Component](https://reactjs.org/docs/higher-order-components.html) in order to pass the Stripe object as a prop to the `<Shop/>` component, so we can call Stripe's `createToken()` function in `handleSubmit` to tokenize the user's so it can be charged.

```javascript
// Shop.js
import { injectStripe } from 'react-stripe-elements'
export default injectStripe(Shop)
```

Once we recieve the tokenized card from Stripe, we are ready to charge it. For now lets just keep it simple and charge the card by sending a POST request to `https://api.stripe.com/v1/charges` with specifying the payment `source` (this is the token id), the charge `amount` (of the charge) and the `currency` as described in the [Stripe API](https://stripe.com/docs/api/charges/create). We need to send the API key in the header for authorization. We can create a restricted API key on the dashboard in the _Developers_ menu. Set the permission for charges to "Read and write" as shown in the screenshot below. *N.B., you should never use your swiss army Secret key on the client*.

![DasboardRestricedApiKey](./images/dashboard_api-key_restricted.png)

Let's take a look at it in action.

```javascript
// Shop.js
// ...
const stripeAuthHeader = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Authorization': `Bearer rk_test_xxxxxxxxxxxxxxxxxxxxxxxx`
}

class Shop extends Component {
  // ...
  handleSubmit(evt) {
    evt.preventDefault()
    this.setState({fetching: true})
    const cart = this.state.cart
    
    this.props.stripe.createToken().then(({token}) => {
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
    }).catch(error => {
      this.setState({fetching: false})
      console.log(error)
    })
  }
  // ...
}
```

For testing purposes you can use these international [cards](https://stripe.com/docs/testing#international-cards) provided by Stripe.

Looks good, we can already create tokens from cards and charge them, but how shoud we know who bought what and where should we send the package? Thats where products and orders come in.

## Placing an order

The simple charging method is a good start, but we will need to take it a step fruther to create orders. To do so, we We have to set up a server and expose an API which handles those orders and accepts webhooks from stripe to process them once they got payed. We will use [express](https://expressjs.com/) to handle the routes of our API. You can find a list below of a couple of other node packages to get started. Let's create a new root folder and get started.

```
npm install express stripe body-parser cors helmet 
```

The skeleton is a simple express [_Hello World_](https://expressjs.com/en/starter/hello-world.html) using [CORS](https://www.npmjs.com/package/cors) so that the browser won't panic when we try to reach our PI server that resides and [Helmet](https://www.npmjs.com/package/helmet) to set a bunch of security headers automatically for us.

```javascript
// index.js
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const app = express()
const port = 3001

app.use(helmet())

app.use(cors({
  origin: [/http:\/\/localhost:\d+$/],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.get('/api/', (req, res) => res.send({ version: '1.0' }))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
```

In order to access Stripe, require Stripe.js and call it straight away with your _Secret Key_ (you can find it in _dashboard->Developers->Api keys_). We will use `stripe.orders.create()` passing the data we receive in when the client calls our server to place an order.

The orders will not be paid automatically. To charge the customer we can either use a Source directly such as a **Card Token ID** or we can create a **[Stripe Customer](https://stripe.com/docs/api/customers/create)**. The added benefit of creating a customer is that we can track multiple charges, or create recurring charges for them and also have Stripe store shipping data for us and other necessary information to fulfill the order. You probably want to create Customers from Card Tokens and shipping data even when your application already handles users. This way you can attach permanent or seasonal discount to those Customers, allow them to shop any time with a single click and [list their orders](https://stripe.com/docs/api/orders/list) on your UI.

Fow now let's keep it simple anyway and use the Card Token as Source calling `stripe.oders.pay()` once the order is successfully created. In a real world scenario, you probably want to separate the order creation and payment exposing them on different endpoints, so if the payment fails the Client can call try again later without having to recreate the order. However, we still have a lot to cover, so let's not overcomplicate things. 

```javascript
// index.js
const stripe = require('stripe')('sk_test_xxxxxxxxxxxxxxxxxxxxxx')

app.post('/api/shop/order', async (req, res) => {
  const order = req.body.order
  const source = req.body.source
  try {
    const stripeOrder = await stripe.orders.create(order)
    console.log(`Order created: ${stripeOrder.id}`)
    await stripe.orders.pay(stripeOrder.id, {source})
  } catch (err) {
    // Handle stripe errors here: No such coupon, sku, ect
    console.log(`Order error: ${err}`)
    return res.sendStatus(404)
  }
  return res.sendStatus(200)
})
```

Now we're able to handle oreders on the backend, but we also need to implement this on the UI. Frst let's implement the state of the `<Shop/>` as an object the Stripe API expects. You can find out how an order request should look like [here](https://stripe.com/docs/api/orders/create). We'll need an `address` object with `line1, city, state, country, postal_code` fields, a `name`, an `email` and a `coupon` field, to get our customers ready for coupon hunting.

```javascript
// Shop.js
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
  // ...
}
```

Now we are ready to create the input fields. We should of course disable the submit button when the input fiealds are empty. Just the usual deal.

```javascript
// Shop.js
render () {
  const state = this.state
  const fetching = state.fetching
  const cart = state.cart
  const address = state.address
  const submittable = (cart.banana !== 0 || cart.cucumber !== 0) && state.email && state.name && address.line1 && address.city && address.state && address.country && address.postal_code
  return (
// ...
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
// ...
```

We also have to define purcahsable items. These items in the will be identified by an [SKU](https://en.wikipedia.org/wiki/Stock_keeping_unit) by Stripe, which can be created on the dasboard as well. First we have to create the Products (_Banana_ and _Cucumber_ on _dashboard->Orders->Products_) and then assign an SKU to them (click on the created product and _Add SKU_ in the _Inventory_ group). An SKU specifies the products including its properties - size, color, quantity and prices -, so a product can have multiple SKUs to it.

![DasboardProduct](./images/dashboard_banana.png)
![DasboardSKU](./images/dashboard_sku.png)

After we created our products and assigned SKUs to them, add them to the webshop so we can parse up the order.

```javascript
// Shop.js
const skus = {
  banana: 1,
  cucumber: 2
}
```

We are ready to send orders to our express API on submit. We do not have to calculate the total price of orders from now on, Stripe can sum it up for as, based on the SKUs, quantitites and coupons.

```javascript
// Shop.js
handleSubmit(evt) {
  evt.preventDefault()
  this.setState({fetching: true})
  const state = this.state
  const cart = state.cart
  
  this.props.stripe.createToken({name: state.name}).then(({token}) => {
    // Create order
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
    // Add coupon if given
    if (state.coupon) {
      order.coupon = state.coupon
    }
    // Send order
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
```

Let's create a coupon for testing purposes. This can be done on the dashboard as well. You can find it under the  _Billing_ menu on the _Coupons_ tab. There are multiple types of coupons based on their duration, but only couponse with the type _Once_ can be used for orders, others can be attached to Stripe Customers. You can also specify a lot of paramters you create a coupon, such as how many times it can be used, is it amount base or a percentage based and when will the coupon expire. Now we need a coupon that can only be used once and provides a reduction on the price by a ceratin percentage.

![DasboardCoupon](./images/dashboard_coupon.png)

Great! Now we have our products, we can create orders and we can also ask Stripe to charge the customer's card for us. But we are still not ready to ship the products as we how no idea at the moment if the charge was successful. To get that information, we need to setup webhooks, so Stripe can let us know when the money is on its way.

![ShopOrders](./images/shop_orders.png)

## Webhooks

As we discussed earlier, we are not assigning cards but Sources to Customers. The reason behind that is Stripe is capable of using [several payment methods](https://stripe.com/docs/sources), some of which may take days to be verified. So we need to setup an endpoint Stripe can call when an event — such as successful payment — has happened. Webhooks are also useful when an event is not initated by us, calling the API straightway, but comes straight from Stripe. Say you have a subscription service, and you don't want to charge the customer every month. Then you can setup a webhook and you will get notified when the recurring payment was successful or if it failed. 

In our case we only want to be notified when an order gets payed. When it happens, the Stripe can notify us by calling an endpoint on our API with an HTTP request sending the payment data in the request body. At the moment, we don't have a static IP, but we need a way to expose our local API to the public internet. We can use [Ngrok](https://ngrok.com/download) for that. Just download it and run with `./ngrok http 3001` command to get an ngrok url pointing to our `localhost:3001`.

We we also have to set up our webhook on the dashboard. Go to _Developers_ -> _Webhooks_, click on _Add endpoint_ and type in your ngrok url followed by the endpoint to be called eg. `http://92832de0.ngrok.io/api/shop/order/process`. Then under _Filter event_ select _Select types to send_ and search for _order.payment_succeeded_.

![DasboardWebhook](./images/dashboard_webhook.png)

The data sent in the request body is encrypted and can only be decrepted using a signature sent in the header and the webhook secret that can be found on the webhooks dashboard. This also means we cannot simply use `bodyParser` to parse the body, so we need to add an exception to `bodyParser` so it will be bypassed when the url starts with `/api/shop/order/process`. We need to use the `stripe.webhooks.constructEvent()` function instead, provided by the Stripe SDK to decrypt the message for us.

```javascript
// index.js
const bodyParser = require('body-parser')

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/shop/order/process')) {
      req.rawBody = buf.toString()
    }
  }
}))

app.use(bodyParser.urlencoded({
  extended: false
}))

app.post('/api/shop/order/process', async (req, res) => {
  const sig = req.headers['stripe-signature']
  try {
    const event = await stripe.webhooks.constructEvent(req.rawBody, sig, 'whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
    console.log(`Processing Order : ${event.data.object.id}`)
    // Process payed order here
  } catch (err) {
    return res.sendStatus(500)
  }
  return res.sendStatus(200)
})
```

After an order was successfully payed, we can parse send it to other APIs like Salesforce or Stamps to pack things up and get ready to send out.
