
// ==============================================================================
// katai5plate / RAAmen
// Version : alpha
// Licence : MIT
// Repository : https://github.com/katai5plate/RAAmen
// ------------------------------------------------------------------------------
// Had2Apps
// WebSite : https://Had2Apps.com
// ==============================================================================
"use strict";

/*:
 * @plugindesc RPGアツマールAPIモック（コア）
 * @author Had2Apps
 *
 * @help
 * RPGアツマールAPIのモックを作ります。
 * このプラグインに追加で別の専用プラグインを繋げて使います。
 *
 * このプラグイン自体の機能：
 * ・2019/02/07 現在のAPIメソッドの網羅
 * ・APIメソッドを呼び出した際のサーバーエラーをシミュレート
 */
(() => {
  const AtsumaruApiError = function (code, message = '') {
    this.errorType = 'atsumaruApiError';
    this.code = code;
    this.message = message;
  };

  const params = {
    // アツマールAPIが存在しなければモック化する
    isEnable: !window.RPGAtsumaru,
    // 意図的にサーバーダウンを再現するか
    isServerError: false,
    // 何 ms に一度の通信を推奨するか
    interval: 5000,
    // 規制する時間
    cooldown: 60000,
    // 規制中
    isFrozen: false,
    // 最終リクエスト
    lastRequest: new Date(0),
    // 凍結開始時間
    freezingStart: new Date(0),
    // 推奨する通信頻度を破った回数
    falseCount: 0,
    // 許容する通信頻度違反回数
    falseMax: 3,
    // 通信頻度を守っても falseCount をリセットしない
    severeFalse: false,
    // レスポンスが返ってくる時間プリセット
    responseTime: {
      normal: 1000,
      modal: 500
    }
  };
  const collections = {
    errors: {
      BAD_REQUEST: new AtsumaruApiError('BAD_REQUEST'),
      UNAUTHORIZED: new AtsumaruApiError('UNAUTHORIZED'),
      API_CALL_LIMIT_EXCEEDED: new AtsumaruApiError('API_CALL_LIMIT_EXCEEDED'),
      FORBIDDEN: new AtsumaruApiError('FORBIDDEN'),
      INTERNAL_SERVER_ERROR: new AtsumaruApiError('INTERNAL_SERVER_ERROR')
    },
    state: {
      scoreboards: [{
        boardId: 1,
        boardName: 'score board',
        myRecord: {
          isNewRecord: false,
          rank: 1,
          score: 0
        },
        ranking: [{
          rank: 1,
          score: 0,
          userName: ''
        }],
        myBestRecord: {
          rank: 1,
          score: 0,
          userName: ''
        }
      }],
      screenshot: {
        handler: new Promise(resolve => {
          setTimeout(() => {
            resolve('default.png');
          }, params.responseTime.normal);
        })
      },
      globalServerVariable: {
        variables: [{
          id: 123,
          body: {
            name: 'G-Variable',
            maxValue: Number.MAX_SAFE_INTEGER,
            minValue: Number.MIN_SAFE_INTEGER,
            value: 123456
          }
        }],
        trigger: {
          callable: [{
            id: 456,
            value: 100
          }],
          specified: [{
            id: 789,
            delta: {
              min: -100,
              max: 100
            }
          }]
        }
      }
    }
  };
  const methods = {
    send() {
      const now = new Date();
      const {
        interval,
        cooldown,
        isFrozen,
        lastRequest,
        freezingStart,
        falseCount,
        falseMax,
        severeFalse
      } = this;

      const error = () => {
        const diff = cooldown - (now - freezingStart);
        const left = (diff <= 0 ? cooldown : diff) / 1000;
        const e = collections.errors.API_CALL_LIMIT_EXCEEDED;
        console.error(`${e.code}: ${left} sec left`);
        return e;
      };

      if (!isFrozen && now - lastRequest < interval) {
        if (falseCount >= falseMax) {
          this.isFrozen = true;
          this.freezingStart = now;
          return {
            result: false,
            error: error()
          };
        }

        console.warn(`Too early! : ${falseMax - falseCount} left`);
        this.falseCount += 1;
      }

      if (isFrozen) {
        if (now - freezingStart < cooldown) {
          return {
            result: false,
            error: error()
          };
        }

        this.isFrozen = false;
        this.falseCount = 0;
      }

      console.info('REQUEST_SUCCEEDED');
      this.lastRequest = now;

      if (falseCount !== 0 && !severeFalse && now - lastRequest > interval) {
        this.falseCount = 0;
      }

      return {
        result: true,
        error: null
      };
    },

    async request({
      // レスポンスが返ってくる時間
      waitTime = params.responseTime.normal,
      // 送信するデータ
      post = {},
      // 第一引数をpostとして、falseだとエラー
      checkValid = p => !!p,
      // 成功時のレスポンス
      succeeded = {},
      // 失敗時のレスポンス
      failed = collections.errors.BAD_REQUEST,
      // RAA.send()を行わないか（非通信）
      client = false
    } = {}) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (client === false) {
            const {
              result: statResult,
              error
            } = this.send();

            if (statResult === false) {
              reject(error);
            }
          }

          if (checkValid(post) === false) {
            reject(failed);
          }

          resolve(succeeded);
        }, waitTime);
      });
    },

    async modal({
      message,
      decorate = s => s,
      checkValid = p => !!p
    } = {}) {
      if (!message) throw new Error('message is undefined');
      await this.request({
        waitTime: this.responseTime.modal,
        post: message,
        succeeded: {
          src: message,
          deco: decorate(message)
        },
        checkValid
      }).then(r => {
        console.info(`MODAL: ${r.src}, DECO: ${r.deco}`);
        alert(r.deco);
      });
    }

  };
  window.RAA = { ...params,
    ...methods,
    ...collections
  };

  if (window.RAA.isEnable) {
    window.RPGAtsumaru = {
      comment: {
        changeScene: () => window.RAA.send(),
        resetAndChangeScene: () => window.RAA.send(),
        pushContextFactor: () => window.RAA.send(),
        pushMinorContext: () => window.RAA.send(),
        setContext: () => window.RAA.send(),
        cameOut: {
          subscribe: () => window.RAA.send()
        },
        posted: {
          subscribe: () => window.RAA.send()
        },
        verbose: () => window.RAA.send()
      },
      controllers: {
        defaultController: {
          subscribe: () => window.RAA.send()
        }
      },
      storage: {
        getItems: () => window.RAA.send(),
        setItems: () => window.RAA.send(),
        removeItem: () => window.RAA.send()
      },
      volume: {
        getCurrentValue: () => window.RAA.send(),
        changed: {
          subscribe: () => window.RAA.send()
        }
      },
      popups: {
        openLink: () => window.RAA.send()
      },
      experimental: {
        query: [],
        popups: {
          displayCreatorInformationModal: () => window.RAA.send()
        },
        scoreboards: {
          setRecord: () => window.RAA.send(),
          display: () => window.RAA.send(),
          getRecords: () => window.RAA.send()
        },
        screenshot: {
          displayModal: () => window.RAA.send(),
          setScreenshotHandler: () => window.RAA.send()
        },
        globalServerVariable: {
          getGlobalServerVariable: () => window.RAA.send(),
          triggerCall: () => window.RAA.send()
        },
        storage: {
          getSharedItems: () => window.RAA.send()
        },
        user: {
          getSelfInformation: () => window.RAA.send(),
          getUserInformation: () => window.RAA.send(),
          getRecentUsers: () => window.RAA.send()
        },
        signal: {
          sendSignalToGlobal: () => window.RAA.send(),
          getGlobalSignals: () => window.RAA.send(),
          sendSignalToUser: () => window.RAA.send(),
          getUserSignals: () => window.RAA.send()
        },
        interplayer: {
          enable: () => window.RAA.send()
        }
      }
    };
  }
})();