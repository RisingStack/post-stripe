# Creating Simple Webshop With Stripe

In this article, we’ll create a simple webshop using Stripe, React and Express.
We'll get familiar with the Stripe Dashboard and basic Stripe features such as charges, customers, orders, coupons and so on. Also we will understand the usage of webhooks and restricted API keys.

## Stripe

First of all, lets clear what Stripe is. It is basically a payment provider, you integrate it to your application pretty easily and than just let the money rain. Pretty simple right? Well, let the economists tell if it is a good provider or not based on the plans they offer. If you are here, you probably want to earn some knowledge on how the integration goes by. So lets build a simple demo application for that. 

![Make it rain](https://media.giphy.com/media/3Jhdg8Qro5kMo/giphy.gif)

Before we start coding, lets create a Stripe account (don't worry, no payment or credit card information required for that, only when you want to _activate_ your account, so you can use it outside of test instance). Go stratight to [Stripe Dashboard](https://dashboard.stripe.com/login) and hit that **Sign up** button. Email, name, password... the usual. **BOOM!** You have a dashboard, a test one actually. You can follow orders, payment flow, customers, basically everything here. And not just follow, but also create and manage them. When it comes to creating new a coupon or product for instance, you can just come up here and click a few buttons, or use simple curls described in the [Stripe API Doc](https://stripe.com/docs/api), or integrate a UI and some endpoints for that with [Stripe.js](https://github.com/stripe/stripe-node). These are your options every time you want to communicate with Stripe: dashboard, curls or integration. Another important menu in this dashboard is the **_Developers_** one, where we will add our first _webhooks_ and create our _restricted API keys_. We will get more familiar with that dashboard and the API in the progress of implementing our demo shop below.

![Dasboard](./images/dashboard.png)

## Webshop with Charges

Lets create a React webshop with two products: Banana and Cucumber. What else would you want to buy in a webshop right? We can use our precious [Create React App](https://github.com/facebook/create-react-app) for that to get started. We will need a few more node packages later. I'm going to use [Axios](https://github.com/axios/axios) for HTTP requests and [query-string-object](https://www.npmjs.com/package/query-string-object) to parse objects to query strings for Stripe requests, you can use anything else you are familiar with for those purposes. The main thing will to need is [React Stripe Elements](https://github.com/stripe/react-stripe-elements), this is a React wrapper for Stripe.js and Stripe Elements, it will add secured credit card inputs and will tokenize cards for us with Stripe from the UI side. Keep in mind, you should never send raw card details to your API, Stripe will handle the credit card security for us.

```
npx create-react-app webshop
cd webshop
npm install --save react-stripe-elements
npm install --save axios
npm install --save query-string-object
```

After the Preparations was made, we have to load Stripe.js in our application at `public/index.html`. Just add `<script src="https://js.stripe.com/v3/"></script>` to the head.
Let's start coding - first we have to add a `<StripeProvider/>` from `react-stripe-elements` to our root React App component, this will give us access to the [Stripe object](https://stripe.com/docs/stripe-js/reference#the-stripe-object), in the props we should pass a public access key (`apiKey`) which is found in the dasboards _Developers_ section under the _API keys_ menu with _Publishable key_ name.

![DasboardApiKey](./images/dashboard_api-key.png)

For the `StripeProvider` child we can add our `<Shop/>` where our shopping form will take place, but before we start implementing it, always group those forms with an `<Elements>` component from `react-stripe-elements`, this will handle the childs of it as a group on tokenizing.

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

Let's create the `Shop.js`. Start with the usual React skeleton, in the return statement we shall create a `<form>`, add two shopping items : `Banana` and `Cucumber`, I'm going to add two buttons for each, increasing and decreasing their quantity in the state under a `cart` property. Below that, a `Reset` button, which will empty our cart. At the bottom a simple submit button, and I'll write down the price the purchase will take by calculating it from the cart quantities and a burnt in `prices` object. You can use the built in `toLocaleString()` function to format those cent prices to USD on the display (Stripe waits for prices in cents when it comes to USD). Creating an input for the card detials is pretty simple: just add a `<CardElment/>` from `react-stripe-elements`, thats it. I'll also add some low effort inline css to make this shop easier to look at.

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

After that, we have to use `injectStripe` [Higher-Order-Component](https://reactjs.org/docs/higher-order-components.html) inorder to provide stripe as a prop for our `<Shop/>` react component, so we can call Stripes `createToken()` function at the submit action to tokenize our card before making any charges to it.

```javascript
// Shop.js
import { injectStripe } from 'react-stripe-elements'
export default injectStripe(Shop)
```

For now lets just make simple charges from the UI to Stripe direcly once we received our token for the card, we can do that by a POST request to `https://api.stripe.com/v1/charges` with giving a payment `source` (this is the token id), a charge `amount` (of the charge) and a `currency` to use. In the header we shall pass an API key for authorization, lets create a restriced one for that in the dashboard under the _Developers_ menu (you should not use your swiss army Secret key at client side). Allow to read and write charges with that key.

![DasboardRestricedApiKey](./images/dashboard_api-key_restricted.png)

We have everything prepared for the submit. Call the `createToken()` async function from `stripe` prop (this will automatically find our card details from the built in `CardElment` from `react-stripe-elements`). After we receive our token, calculate the price from the cart and our prices object, and send our query to `https://api.stripe.com/v1/charges` as described in the [Stripe API](https://stripe.com/docs/api/charges/create).

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

For testing purposes you can use these international [cards](https://stripe.com/docs/testing#international-cards).

![ShopCharges](./images/shop_charges.png)

Looks good, we can already create tokens from cards and charge them, but how shoud we know who bought what and where should we send the package? Thats where products and orders comes in.

## Ordering

This charging method is a good start, but we are going to dump that now and go one step further to orders. We will need an API which handles those orders and accepts webhooks from stripe to process them once they got payed. Lets create an [Express](https://expressjs.com/) API. We will need a couple of other node packages to get started (listed below). Create a new root folder and install those packages.

```
npm install --save express
npm install --save stripe
npm install --save body-parser
npm install --save-dev cors
npm install --save-dev helmet
npm install --save-dev nodemon
```

The skeleton is a simple express [_Hello World_](https://expressjs.com/en/starter/hello-world.html) with [Cors](https://www.npmjs.com/package/cors) and [Helmet](https://www.npmjs.com/package/helmet), so we can communicate with it from our webshop React app. After creating your `index.js`, you can run the Express API with hot-load by `./node_modules/.bin/nodemon` command thanks to [nodemon](https://nodemon.io/), or just add a script for it in the package.json.


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

In order to access Stripe, require Stripe.js with your _Secret Key_ as a parameter (found at _dashboard->Developers->Api keys_). Now you can call a lot of built in functions from Stripe.js, such as `stripe.orders.create()`, which we gonna do just here with an order from the request body.

Those orders will not be paid automatically. We have two ways to pay an order: with a Source such as a **Card Token ID** or with a **[Customer](https://stripe.com/docs/api/customers/create)**. A Customer object basically only needs a Source which can be the **Card Token ID**, but when you create them it would make sense to add shipping data for it also. You should consider creating Customers from Card Tokens and Shipping data when your application already have a registration function in it, so you can also record your returning customer at Stripe, and save their Customer ID to their application account. This way you can attach permanent or seasonal discount to those Customers, allow them to shop any time with a single click and [list their orders](https://stripe.com/docs/api/orders/list) on a UI for instance based on their customer id.

Lets pay our order by passing the Order ID and a Card Token ID as a Source to the `stripe.orders.pay()` call after the order was succesfully created. You could bind this pay process to another express endpoint also, so if the payment fails, the Client can call it later to try the payment again on the order that was already made. But this is just a demo so we should not over complicate our shop with functions like post-payment, order listing, ect.

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
    return res.sendStatus(500)
  }
  return res.sendStatus(200)
})
```

Looks good, but we are going to need to get those records from the customer at the UI.
For that lets add the structure Stripe requires to create an Order to the state of `<Shop/>` with handlers. You can find out how an order post should look like [here](https://stripe.com/docs/api/orders/create). Add an `address` object with `line1, city, state, country, postal_code` keys, a `name`, an `email` and a `coupon` field, to get our customers ready for coupon hunting.

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

Now the input fields comes in. Also we should disable the submit button when these fields are empty (except the coupon field). Nothing unusual.

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

To create orders we have to add the items to it. These purchesable items in the order needs to be identified as an [SKU](https://en.wikipedia.org/wiki/Stock_keeping_unit), which can be created at the dasboard also. Firstly we have to create the Products (_Banana_ and _Cucumber_ at _dashboard->Orders->Products_) and than add the SKU to them (click on the created product and _Add SKU_ in the _Inventory_ group). An SKU specifies the products with properties - what size, color, quantity and in which prices we got those -, so a product can have multiple SKUs to it.

![DasboardProduct](./images/dashboard_banana.png)
![DasboardSKU](./images/dashboard_sku.png)

After we made our products and the SKUs for it, add them to the webshop so we can parse up the order.

```javascript
const skus = {
  banana: 1,
  cucumber: 2
}
```

We are ready to send the orders to our express API on submit after parsing up the order object. We do not have to calculate the price of the order from now on, Stripe will calculate it with the given SKUs, quantitites and coupons.

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

Lets create a coupon for testing purposes. This can be achieved at the dashboard also. Find it at the _Billing_ menu under the _Coupons_ tab. There are multiple types of coupons based on duration, keep in mind only _Once_ type can be used with orders, others can be attached for Stripe Customers. You can also specify a lot of paramters on creating a coupon, such as how many times a coupon can be used, is it an amount or a percentage off and when will the coupon expire. Now we only need a once duration coupon with some amount off on it.

![DasboardCoupon](./images/dashboard_coupon.png)

Everthing works fine, we can already create orders and pay them. Lets go on to webhooks.

![ShopOrders](./images/shop_orders.png)

## Webhooks

Lets setup our first Stripe webhook, so when an order gets payed, the Stripe API will send our Express API an HTTP request with that order in it to process. For that we have to expose our local Express server for Stripe. You can use [Ngrok](https://ngrok.com/download) for that. Just download it and run with `./ngrok http 3001` command to get an ngrok url forwarding every request to our `localhost:3001`.

We can set up our webhook at the dashboard, select _Developers_ menu and _Webhooks_ page, click on _Add endpoint_, insert your ngrok url with a desired endpoint, let say we will create an endpoint called `/api/shop/order/process`, at the _Filter event_ select _Select types to send_ and search for _order.payment_succeeded_.

![DasboardWebhook](./images/dashboard_webhook.png)

Webhooks going to send us the exact event which triggered the webhook, parsing this event into a JSON structure is possible with the `stripe.webhooks.constructEvent()` function, but only with a raw request body. We need to add those with the `bodyParser` package if the requested endpoint matches with our order processing one. Also this `constructEvent` will need a signature that can be taken from the request header, and a webhook secret, found at the dashboards webhooks list after the webhook was created.

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

Done. After an order was successfully payed, we can parse send it to other APIs like Salesforce or Stamps to pack things up and get ready to send out.
