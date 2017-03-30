/*
This is the bot core. This implements all messenger platform APIs and thread
settings. It is also used to verify facebook webhook.
*/
'use strict';
const url = require('url');
const qs = require('querystring');
const request = require('request');
const rp = require('request-promise');
const crypto = require('crypto');

class Bot {
  constructor(opts) {
    opts = opts || {}
    if (!opts.token) {
      throw new Error('Missing page token. See FB documentation for details: https://developers.facebook.com/docs/messenger-platform/quickstart');
    }
    this.token = opts.token;
    this.app_secret = opts.app_secret || false;
    this.verify_token = opts.verify_token || false;
    this.debug = opts.debug || false;
  }

  getProfile2(id) {
    return new Promise(
      (resolve, reject) => {
        rp({
          method: 'GET',
          uri: `https://graph.facebook.com/v2.6/${id}`,
          qs: this._getQs({
            fields: 'first_name,last_name,profile_pic,locale,timezone,gender'
          }),
          json: true
        })
        .then(function (body) {
          // console.log("body from bot class:", body)
          resolve(body);
        })
        .catch(function (err) {
          reject(err)
        })
      })
  }

  sendMessage(recipient, payload) {
    console.log("payload :", payload);
    return new Promise((resolve, reject) =>{
          rp({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: this._getQs(),
            method: 'POST',
            json: {
              recipient: {
                id:recipient
              },
              message: { text:payload }
            }
          })
          .then(function () {
            // console.log("body from bot class send message:", body)
            resolve();
          })
          .catch(function (err) {
            reject(err)
          })
        });
  }

  sendSenderAction(recipient, senderAction) {
    console.log(recipient, senderAction);
    return new Promise((resolve, reject) =>{
      rp({
        method: 'POST',
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: this._getQs(),
        json: {
          recipient: {
            id: recipient
          },
          sender_action: senderAction
        }
      })
    .then(function (body) {
      resolve(body);
    })
    .catch(function (err) {
      reject(err)
    })
  })
  }

  setThreadSettings(threadSettings) {
    return new Promise((resolve, reject) =>{
      rp({
        method: 'POST',
        uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: this._getQs(),
        json: threadSettings
      })
    })
    .then(function (body) {
      resolve(body);
    })
    .catch(function (err) {
      reject(err)
    })
  }

  removeThreadSettings(threadState) {
    return new Promise((resolve, reject) =>{
      rp({
        method: 'DELETE',
        uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: this._getQs(),
        json: {
          setting_type: 'call_to_actions',
          thread_state: threadState
        }
      })
    })
    .then(function (body) {
      resolve(body);
    })
    .catch(function (err) {
      reject(err)
    })
  }

  setGetStartedButton(payload) {
    let threadSettings = {
      setting_type: 'call_to_actions',
      thread_state: 'new_thread',
      call_to_actions: payload
    }
    return new Promise((resolve, reject) =>{
      return this.setThreadSettings(threadSettings)
      .then(function () {
        resolve();
      })
      .catch(function (err) {
        reject(err)
      })
    })
  }

  setGreetings(payload) {
    let threadSettings = {
      setting_type: 'greeting',
      greeting: payload
    }
    return new Promise((resolve, reject) =>{
      return this.setThreadSettings(threadSettings)
      .then(function () {
        resolve();
      })
      .catch(function (err) {
        reject(err)
      })
    })
  }

  setPersistentMenu(payload) {
    let threadSettings = {
      setting_type: 'call_to_actions',
      thread_state: 'existing_thread',
      call_to_actions: payload
    }
    return new Promise((resolve, reject) =>{
      return this.setThreadSettings(threadSettings)
      .then(function () {
        resolve();
      })
      .catch(function (err) {
        reject(err)
      })
    })
  }

  removeGetStartedButton() {
    return new Promise((resolve, reject) =>{
      return this.removeThreadSettings('new_thread')
      .then(function () {
        resolve();
      })
      .catch(function (err) {
        reject(err)
      })
    })

  }

  removePersistentMenu() {
    return new Promise((resolve, reject) =>{
      return this.removeThreadSettings('existing_thread')
      .then(function () {
        resolve();
      })
      .catch(function (err) {
        reject(err)
      })
    })
  }

  _getQs(qs) {
    if (typeof qs === 'undefined') {
      qs = {}
    }
    qs['access_token'] = this.token;

    if (this.debug) {
      qs['debug'] = this.debug;
    }

    return qs;
  }

  _verify(req, res) {
    let query = qs.parse(url.parse(req.url).query);

    if (query['hub.verify_token'] === this.verify_token) {
      return res.end(query['hub.challenge']);
    }

    return res.end('Error, wrong verify token');
  }
}

module.exports = Bot