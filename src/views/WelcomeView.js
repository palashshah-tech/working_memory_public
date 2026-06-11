/* ============================================================
   Welcome View — Stealth Pro Edition
   ============================================================ */

import { render } from '../utils/dom.js';
import { Storage } from '../utils/storage.js';
import { navigate, injectStyle } from '../router.js';
import { t, getLang, setLang } from '../utils/i18n.js';
import { ensureAccessAndSession, startHeartbeat } from '../utils/access.js';

const LEGAL_CONTENT = {
  en: {
    privacy: `
      <h2>PRIVACY POLICY</h2>
      <p>Xiberlinc operates this website, which offers some tools for capturing personal information to be used in our services and in market-facing communications.</p>
      <p>This page is used to inform website visitors regarding our policies with the collection, use, and disclosure of Personal Information collected by Xiberlinc.</p>
      <p>If you choose to use Xiberlinc services, then you agree to the collection and use of information in relation with this policy. The Personal Information that we collect are used for providing and improving our services. We will not use or share your information with anyone except as described in this Privacy Policy.</p>
      
      <h3>INFORMATION COLLECTION AND USE</h3>
      <p>For a better experience while using our services, we may require you to provide us with certain personally identifiable information, including but not limited to your name, phone number, and postal address. The information that we collect will be used to contact or identify you.</p>
      
      <h3>LOG DATA</h3>
      <p>We want to inform you that whenever you visit our Service, we collect information that your browser sends to us that is called Log Data. This Log Data may include information such as your computer's Internet Protocol ("IP") address, browser version, pages of our site that you visit, the time and date of your visit, the time spent on those pages, and other statistics.</p>
      
      <h3>COOKIES</h3>
      <p>Cookies are files with small amount of data that is commonly used an anonymous unique identifier. These are sent to your browser from the website that you visit and are stored on your computer's hard drive.</p>
      <p>Our website uses these "cookies" to collection information and to improve our service. You have the option to either accept or refuse these cookies, and know when a cookie is being sent to your computer. If you choose to refuse our cookies, you may not be able to use some portions of our service.</p>
      
      <h3>SERVICE PROVIDERS</h3>
      <p>We may employ third-party companies and individuals due to the following reasons:</p>
      <ul>
        <li>To facilitate our service;</li>
        <li>To perform related services; or</li>
        <li>To assist us in analyzing how our service is used.</li>
      </ul>
      <p>We want to inform our users that these third parties have access to your Personal Information. The reason is to perform the tasks assigned to them on our behalf. However, they are obligated not to disclose or use the information for any other purpose.</p>
      
      <h3>SECURITY</h3>
      <p>We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.</p>
      
      <h3>LINKS TO OTHER SITES</h3>
      <p>Our Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these websites. We have no control over, and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>
      
      <h3>CHILDREN'S PRIVACY</h3>
      <p>Our Services do not address anyone under the age of 13. We do not knowingly collect personal identifiable information from children under 13. In the case we discover that a child under 13 has provided us with personal information, we immediately delete this from our servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we will be able to do necessary actions.</p>
      
      <h3>CHANGES TO THIS PRIVACY POLICY</h3>
      <p>We may update our Privacy Policy from time to time. Thus, we advise you to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately, after they are posted on this page.</p>
      
      <h3>CONTACT US</h3>
      <p>If you have any questions or suggestions about our Privacy Policy, please do not hesitate to let us know via Contact Us.</p>
    `,
    accessibility: `
      <h2>ACCESSIBILITY STATEMENT</h2>
      <p>Xiberlinc is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone, and applying the relevant accessibility standards to our cognitive assessment tools.</p>
      <h3>Measures to support accessibility</h3>
      <p>Xiberlinc takes the following measures to ensure accessibility of Xiberlinc Cognitive Portal:</p>
      <ul>
        <li>Include accessibility throughout our internal policies.</li>
        <li>Integrate accessibility into our procurement practices.</li>
        <li>Provide continual accessibility training for our staff.</li>
        <li>Assign clear accessibility targets and responsibilities.</li>
      </ul>
      <h3>Conformance status</h3>
      <p>The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Xiberlinc Cognitive Portal is partially conformant with WCAG 2.1 level AA.</p>
    `,
    act: `
      <h2>ACT ON SPECIFIED COMMERCIAL TRANSACTIONS</h2>
      <p>Below is the disclosure in accordance with the Act on Specified Commercial Transactions in Japan.</p>
      <table class="legal-table">
        <tr><th>Seller / Provider</th><td>Xiberlinc Inc.</td></tr>
        <tr><th>Representative</th><td>Palash Shah / Chris</td></tr>
        <tr><th>Address</th><td>Tokyo, Japan</td></tr>
        <tr><th>Contact</th><td>support@xiberlinc.com</td></tr>
        <tr><th>Service Price</th><td>Provided on registration or custom contract basis.</td></tr>
        <tr><th>Additional Charges</th><td>None. Candidate evaluation is covered by employer/sponsor agreements.</td></tr>
        <tr><th>Payment Methods</th><td>Bank Transfer, Credit Card.</td></tr>
        <tr><th>Service Provision</th><td>Immediately accessible after account registration and verification.</td></tr>
        <tr><th>Refunds & Cancellations</th><td>Due to the digital nature of the cognitive testing, refunds are not accepted once the test is initiated.</td></tr>
      </table>
    `
  },
  ja: {
    privacy: `
      <h2>プライバシーポリシー</h2>
      <p>Xiberlincは本ウェブサイトを運営しており、当社のサービスや市場向けのコミュニケーションで使用される個人情報を取得するためのツールを提供しています。</p>
      <p>このページは、Xiberlincが収集した個人情報の収集、使用、および開示に関する当社のポリシーをウェブサイトの訪問者に通知するために使用されます。</p>
      <p>Xiberlincのサービスを使用することを選択した場合、このポリシーに関連する情報の収集および使用に同意したものとみなされます。収集された個人情報は、サービスの提供および向上のために使用されます。このプライバシーポリシーに記載されている場合を除き、お客様の情報を第三者と共有または使用することはありません。</p>
      
      <h3>情報の収集と使用</h3>
      <p>当社のサービスをより快適にご利用いただくために、氏名、電話番号、郵便番号を含むがこれらに限定されない、特定の個人を特定できる情報の提供をお願いする場合があります。収集された情報は、お客様への連絡または特定のために使用されます。</p>
      
      <h3>ログデータ</h3>
      <p>お客様が当社のサービスにアクセスするたびに、ブラウザから送信される「ログデータ」と呼ばれる情報を収集していることをお知らせします。このログデータには、お客様のコンピュータのインターネットプロトコル（「IP」）アドレス、ブラウザのバージョン、アクセスした当社のページの履歴、アクセスした日時、それらのページで費やした時間、およびその他の統計情報が含まれる場合があります。</p>
      
      <h3>クッキー（Cookies）</h3>
      <p>クッキーは、匿名の一意の識別子として一般的に使用される少量のデータを含むファイルです。これらはアクセスしたウェブサイトからブラウザに送信され、コンピュータのハードドライブに保存されます。</p>
      <p>当社のウェブサイトは、情報を収集し、サービスを向上させるためにこれらの「クッキー」を使用します。これらのクッキーを受け入れるか拒否するかを選択し、クッキーがいつコンピュータに送信されるかを知ることができます。クッキーを拒否することを選択した場合、サービスの一部をご利用いただけない場合があります。</p>
      
      <h3>サービスプロバイダー</h3>
      <p>当社は、以下の理由により、第三者の企業および個人を雇用する場合があります：</p>
      <ul>
        <li>当社のサービスを促進するため</li>
        <li>関連サービスを提供するため</li>
        <li>当社のサービスがどのように使用されているかを分析するのを支援するため</li>
      </ul>
      <p>これらの第三者がお客様の個人情報にアクセスできることをユーザーにお知らせします。その理由は、当社に代わって割り当てられたタスクを実行するためです。しかし、彼らは情報を他の目的で開示または使用しない義務を負っています。</p>
      
      <h3>セキュリティ</h3>
      <p>お客様の個人情報を提供していただく際の信頼を尊重し、商業的に許容される手段を用いて保護するよう努めています。ただし、インターネットを介した送信方法や電子ストレージの方法は100%安全で信頼できるものではなく、絶対的なセキュリティを保証することはできません。</p>
      
      <h3>他サイトへのリンク</h3>
      <p>当社のサービスには、他のサイトへのリンクが含まれている場合があります。関係するリンクをクリックすると、そのサイトにリダイレクトされます。これらの外部サイトは当社によって運営されていないことに注意してください。したがって、これらのウェブサイトのプライバシーポリシーを確認することを強くお勧めします。当社は、第三者のサイトまたはサービスのコンテンツ、プライバシーポリシー、または慣行について一切管理せず、責任を負いません。</p>
      
      <h3>子どものプライバシー</h3>
      <p>当社のサービスは13歳未満の者を対象としていません。当社は13歳未満の子どもから個人を特定できる情報を意図的に収集することはありません。13歳未満の子どもが個人情報を提供したことを発見した場合、直ちに当社のサーバーからこれを削除します。あなたが親または保護者であり、お子様が個人情報を提供したことを知っている場合は、必要な対応を取るために当社にご連絡ください。</p>
      
      <h3>プライバシーポリシーの変更</h3>
      <p>プライバシーポリシーは随時更新されることがあります。したがって、変更がないかこのページを定期的に確認することをお勧めします。このページに新しいプライバシーポリシーを掲載することにより、変更を通知します。これらの変更は、このページに掲載された直後に有効になります。</p>
      
      <h3>お問い合わせ</h3>
      <p>プライバシーポリシーに関するご質問やご提案がございましたら、お問い合わせ窓口までお気軽にご連絡ください。</p>
    `,
    accessibility: `
      <h2>アクセシビリティ方針</h2>
      <p>Xiberlincは、障害のある方々に対するデジタルアクセシビリティの確保に努めています。私たちはすべての人々のユーザーエクスペリエンスを継続的に向上させ、認知評価ツールに関連するアクセシビリティ基準を適用しています。</p>
      <h3>アクセシビリティ維持への取り組み</h3>
      <p>Xiberlincは、Xiberlinc認知評価ポータルのアクセシビリティを確保するために以下の措置を講じています：</p>
      <ul>
        <li>社内ポリシーにアクセシビリティ基準を組み込む。</li>
        <li>調達・開発プロセスにアクセシビリティを取り入れる。</li>
        <li>スタッフへの継続的なアクセシビリティ研修の実施。</li>
        <li>明確なアクセシビリティ目標と責任の割り当て。</li>
      </ul>
      <h3>適合状況</h3>
      <p>Web Content Accessibility Guidelines（WCAG）は、デザイナーやデベロッパーが障害のある方々のアクセシビリティを向上させるための要件を定義しています。Xiberlinc認知評価ポータルは、WCAG 2.1 レベルAAに部分的に適合しています。</p>
    `,
    act: `
      <h2>特定商取引法に基づく表記</h2>
      <p>特定商取引法に基づく表示事項は以下の通りです。</p>
      <table class="legal-table">
        <tr><th>販売業者</th><td>株式会社Xiberlinc</td></tr>
        <tr><th>代表責任者</th><td>Palash Shah / Chris</td></tr>
        <tr><th>所在地</th><td>東京都</td></tr>
        <tr><th>連絡先</th><td>お問い合わせ窓口（support@xiberlinc.com）</td></tr>
        <tr><th>サービス価格</th><td>ご登録またはご契約プランごとに提示されます。</td></tr>
        <tr><th>追加料金</th><td>なし。適性検査費用は、雇用主またはスポンサー企業との契約に含まれます。</td></tr>
        <tr><th>支払方法</th><td>銀行振込、クレジットカード決済。</td></tr>
        <tr><th>提供時期</th><td>アカウント登録・認証完了後、直ちにご利用いただけます。</td></tr>
        <tr><th>返品・返金</th><td>サービスの性質上、検査開始後のキャンセルや返金には応じかねます。</td></tr>
      </table>
    `
  }
};

export function WelcomeView(params = {}) {
  render(`
    <div class="view wv">
      <!-- Background Grid -->
      <div class="wv-grid"></div>

      <div class="wv-content animate-fade">
        <header class="wv-header">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px;">
            <img src="/xiberlinc_logo.png" alt="Xiberlinc" style="height:42px; mix-blend-mode:screen;" />
            <div style="display:flex; gap:12px; align-items:center;">
              <button id="lang-toggle" class="btn-ghost" style="padding:4px 10px; font-size:12px; border-radius:4px;">${t('lang_toggle')}</button>
              <div class="badge badge-volt">${t('badge_task')}</div>
            </div>
          </div>
          <h1 class="wv-title">${t('app_title')}${getLang() === 'ja' ? '' : '<span class="dot">.</span>'}</h1>
          <p class="wv-tagline">${t('app_tagline')}</p>
        </header>

        <div class="wv-main glass-card">
          <form id="reg-form" class="wv-form">
            <h2 class="form-title">${t('intake_title')}</h2>
            <div class="input-grid">
              <div class="field">
                <label>${t('label_name')}</label>
                <input type="text" id="r-name" placeholder="${t('placeholder_name')}" required />
              </div>
              <div class="field">
                <label>${t('label_email')}</label>
                <input type="email" id="r-email" placeholder="${t('placeholder_email')}" required />
              </div>
              <div class="field">
                <label>${t('label_age')}</label>
                <input type="number" id="r-age" min="13" max="60" placeholder="${t('placeholder_age')}" required />
              </div>
              <div class="field">
                <label>${t('label_gender')}</label>
                <select id="r-gender" required style="background:#000; border:1px solid var(--border-medium); padding:14px; color:#fff; font-family:var(--font-body); font-size:14px;">
                  <option value="" disabled selected>${t('gender_select')}</option>
                  <option value="Male">${t('gender_male')}</option>
                  <option value="Female">${t('gender_female')}</option>
                  <option value="Other">${t('gender_other')}</option>
                  <option value="Undisclosed">${t('gender_none')}</option>
                </select>
              </div>
              <div class="field" style="grid-column: 1 / -1;">
                <label>${t('label_handle')}</label>
                <input type="text" id="r-handle" placeholder="${t('placeholder_handle')}" required />
              </div>
            </div>

            <div class="wv-footer" style="flex-direction: column; align-items: stretch; gap: 16px;">
              <div class="privacy-wrap" style="display:flex; align-items:flex-start; gap:12px;">
                <input type="checkbox" id="r-privacy" required style="margin-top:2px; width:auto; cursor:pointer;" />
                <label for="r-privacy" style="font-size:12px; color:#ffffff; line-height:1.4; cursor:pointer; font-family:var(--font-body);">${t('privacy_text')}</label>
              </div>
              <p class="notice" style="max-width:none; color:#ffffff;">
                <span>${t('disclaimer_text')}</span>
              </p>
              <button type="submit" class="btn-volt" style="align-self: flex-end;">${t('btn_init')}</button>
            </div>
          </form>
        </div>

        <footer class="wv-legal" style="flex-direction: column; align-items: center; gap: 8px;">
          <div class="legal-links" style="display:flex; gap:16px; font-size:11px; margin-bottom: 8px;">
            <a href="#" id="link-privacy" style="color:#ffffff; text-decoration:none; transition: color var(--transition-fast);">${t('legal_privacy')}</a>
            <span style="color:#666;">|</span>
            <a href="#" id="link-accessibility" style="color:#ffffff; text-decoration:none; transition: color var(--transition-fast);">${t('legal_accessibility')}</a>
          </div>
          <span style="color: #666;">v1.2</span>
        </footer>
      </div>

      <!-- Legal Modal -->
      <div id="legal-modal" class="legal-modal-overlay">
        <div class="legal-modal-card glass-card">
          <header class="legal-modal-header">
            <h3 id="legal-modal-title">Privacy Policy</h3>
            <button id="legal-modal-close" class="btn-ghost-modal">&times;</button>
          </header>
          <div id="legal-modal-body" class="legal-modal-body"></div>
        </div>
      </div>

    </div>
  `);

  injectStyle(`
    .wv {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
      position: relative;
    }

    .wv-grid {
      position: fixed; inset: 0;
      background-image: 
        linear-gradient(var(--border-dim) 1px, transparent 1px),
        linear-gradient(90deg, var(--border-dim) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(circle at center, black, transparent 80%);
      pointer-events: none;
    }

    .wv-content {
      width: 100%;
      max-width: 800px;
      z-index: 10;
    }

    .wv-header {
      margin-bottom: var(--space-12);
      text-align: left;
    }

    .wv-title {
      margin: var(--space-4) 0;
      text-transform: uppercase;
    }
    .wv-title .dot { color: var(--accent-volt); }

    .wv-tagline {
      font-size: 1.1rem;
      color: #ffffff;
      line-height: 1.5;
    }

    .form-title {
      font-size: 1.5rem;
      margin-bottom: var(--space-8);
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.1em;
      color: #fff;
    }

    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 40px;
    }
    @media (max-width: 600px) { .input-grid { grid-template-columns: 1fr; } }

    .field { display: flex; flex-direction: column; gap: 8px; }
    .field label {
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      color: #ffffff;
      letter-spacing: 0.1em;
    }

    input {
      background: #000;
      border: 1px solid var(--border-medium);
      padding: 14px;
      color: #fff;
      font-family: var(--font-body);
      font-size: 14px;
      transition: var(--transition-fast);
    }
    input:focus {
      border-color: var(--accent-volt);
      outline: none;
      box-shadow: 0 0 10px var(--accent-volt-dim);
    }
    /* Hide number input spin-buttons (ticker) for clean look */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type=number] {
      -moz-appearance: textfield;
    }
    /* Override browser default autofill background and text color */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px #000 inset !important;
      -webkit-text-fill-color: #fff !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    .wv-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      padding-top: 32px;
      border-top: 1px solid var(--border-dim);
    }
    @media (max-width: 700px) { .wv-footer { flex-direction: column; text-align: center; } }

    .notice { font-size: 13px; max-width: 400px; line-height: 1.6; }
    .notice strong { color: var(--accent-volt); font-family: var(--font-mono); font-size: 11px; }

    .wv-legal {
      margin-top: 48px;
      display: flex; justify-content: center;
      font-family: var(--font-mono); font-size: 10px; color: #ffffff;
      text-transform: uppercase; letter-spacing: 0.2em;
    }
    
    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-dim);
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.2s;
    }
    .btn-ghost:hover {
      background: rgba(255,255,255,0.05);
      color: var(--text-primary);
    }

    /* Legal Modal Styles */
    .legal-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 24px;
    }
    .legal-modal-overlay.active {
      display: flex;
    }
    .legal-modal-card {
      max-width: 680px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      background: rgba(10, 10, 12, 0.95);
      border: 1px solid var(--border-medium);
      border-radius: 16px;
      overflow: hidden;
      animation: legal-modal-zoom 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes legal-modal-zoom {
      0% { opacity: 0; transform: scale(0.95) translateY(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .legal-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-dim);
      background: rgba(255,255,255,0.02);
    }
    .legal-modal-header h3 {
      font-family: var(--font-display);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #fff;
      margin: 0;
    }
    .btn-ghost-modal {
      background: transparent;
      color: var(--text-secondary);
      border: none;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
      padding: 4px 8px;
      transition: color var(--transition-fast);
    }
    .btn-ghost-modal:hover {
      color: var(--accent-volt);
    }
    .legal-modal-body {
      padding: 24px;
      overflow-y: auto;
      font-size: 14px;
      line-height: 1.6;
      color: #ffffff;
      max-height: calc(80vh - 70px);
      text-align: left;
    }
    .legal-modal-body h2 {
      font-size: 18px;
      color: #fff;
      margin-top: 0;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 8px;
    }
    .legal-modal-body h3 {
      font-size: 13px;
      color: var(--accent-volt);
      margin-top: 24px;
      margin-bottom: 8px;
      font-family: var(--font-mono);
      text-transform: uppercase;
    }
    .legal-modal-body p {
      margin-bottom: 16px;
      color: #ffffff !important;
    }
    .legal-modal-body ul {
      margin-bottom: 16px;
      padding-left: 20px;
    }
    .legal-modal-body li {
      margin-bottom: 8px;
      color: #ffffff !important;
    }
    .legal-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 13px;
    }
    .legal-table th, .legal-table td {
      border: 1px solid rgba(255,255,255,0.08);
      padding: 12px;
      text-align: left;
    }
    .legal-table th {
      background: rgba(255,255,255,0.02);
      color: #fff;
      width: 35%;
      font-weight: 600;
    }
    .legal-table td {
      color: #ffffff;
    }
    
    /* Scrollbar styling */
    .legal-modal-body::-webkit-scrollbar {
      width: 6px;
    }
    .legal-modal-body::-webkit-scrollbar-track {
      background: transparent;
    }
    .legal-modal-body::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 99px;
    }
    .legal-modal-body::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.25);
    }
    
    .legal-links a:hover {
      color: var(--accent-volt) !important;
    }

    @media (min-width: 1400px) {
      .wv-container { max-width: 1100px; }
      .wv-title { font-size: 4rem; }
      .wv-tagline { font-size: 1.3rem; }
      .form-title { font-size: 1.8rem; }
      input, select { padding: 18px; font-size: 16px; }
      .field label { font-size: 12.5px; }
      .wv-main { padding: 48px !important; }
    }
    @media (min-width: 1800px) {
      .wv-container { max-width: 1300px; }
      .wv-title { font-size: 4.8rem; }
      .wv-tagline { font-size: 1.5rem; }
      .form-title { font-size: 2.1rem; }
      input, select { padding: 22px; font-size: 18px; }
      .field label { font-size: 14px; }
      .wv-main { padding: 60px !important; }
    }
  `);

  document.getElementById('lang-toggle').addEventListener('click', () => {
    const nameVal = document.getElementById('r-name')?.value || '';
    const emailVal = document.getElementById('r-email')?.value || '';
    const ageVal = document.getElementById('r-age')?.value || '';
    const genderVal = document.getElementById('r-gender')?.value || '';
    const handleVal = document.getElementById('r-handle')?.value || '';
    const privacyChecked = document.getElementById('r-privacy')?.checked || false;

    const newLang = getLang() === 'en' ? 'ja' : 'en';
    setLang(newLang);
    WelcomeView(); // Re-render

    if (document.getElementById('r-name')) document.getElementById('r-name').value = nameVal;
    if (document.getElementById('r-email')) document.getElementById('r-email').value = emailVal;
    if (document.getElementById('r-age')) document.getElementById('r-age').value = ageVal;
    if (document.getElementById('r-gender')) document.getElementById('r-gender').value = genderVal;
    if (document.getElementById('r-handle')) document.getElementById('r-handle').value = handleVal;
    if (document.getElementById('r-privacy')) document.getElementById('r-privacy').checked = privacyChecked;
  });

  // Modal Setup
  const modal = document.getElementById('legal-modal');
  const modalTitle = document.getElementById('legal-modal-title');
  const modalBody = document.getElementById('legal-modal-body');
  const modalClose = document.getElementById('legal-modal-close');

  const showModal = (type) => {
    const lang = getLang();
    const content = LEGAL_CONTENT[lang] || LEGAL_CONTENT['en'];
    
    let title = '';
    if (type === 'privacy') title = t('legal_privacy');
    else if (type === 'accessibility') title = t('legal_accessibility');
    else if (type === 'act') title = t('legal_act');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = content[type] || '';
    modal.classList.add('active');
  };

  const hideModal = () => {
    modal.classList.remove('active');
  };

  // Bind links
  ['privacy', 'accessibility'].forEach(type => {
    const el = document.getElementById(`link-${type}`);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(type);
      });
    }
  });
  
  // Bind inline privacy link
  const inlineEn = document.getElementById('agree-privacy-link');
  if (inlineEn) {
    inlineEn.addEventListener('click', (e) => {
      e.preventDefault();
      showModal('privacy');
    });
  }
  const inlineJa = document.getElementById('agree-privacy-link-ja');
  if (inlineJa) {
    inlineJa.addEventListener('click', (e) => {
      e.preventDefault();
      showModal('privacy');
    });
  }

  modalClose.addEventListener('click', hideModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  document.getElementById('reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name   = document.getElementById('r-name').value.trim();
    const email  = document.getElementById('r-email').value.trim();
    const ageRaw = document.getElementById('r-age').value.trim();
    const gender = document.getElementById('r-gender').value;
    const handle = document.getElementById('r-handle').value.trim();

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(el => el.remove());

    const errors = [];

    if (name.length < 2) errors.push({ id: 'r-name', msg: 'Name must be at least 2 characters' });

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) errors.push({ id: 'r-email', msg: 'Enter a valid email address' });

    const age = parseInt(ageRaw);
    if (isNaN(age) || age < 13 || age > 60) errors.push({ id: 'r-age', msg: 'Age must be between 13 and 60' });

    if (handle.length < 2) errors.push({ id: 'r-handle', msg: 'Handle must be at least 2 characters' });

    if (!document.getElementById('r-privacy').checked) {
      errors.push({ id: 'r-privacy', msg: t('err_privacy') });
    }

    if (errors.length > 0) {
      errors.forEach(({ id, msg }) => {
        const input = document.getElementById(id);
        if (input) input.style.borderColor = '#ff4d4d';
        const errEl = document.createElement('span');
        errEl.className = 'field-error';
        errEl.style.cssText = 'color:#ff4d4d;font-size:11px;font-family:var(--font-mono);margin-top:4px;';
        errEl.textContent = msg;
        if (input && input.parentElement) input.parentElement.appendChild(errEl);
      });
      return;
    }

    const sessionInfo = await ensureAccessAndSession();
    if (!sessionInfo.ok) {
      return;
    }

    startHeartbeat();

    const metadata = {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      userAgent: navigator.userAgent
    };

    sessionStorage.removeItem('practice_done_vwm-pure');
    sessionStorage.removeItem('practice_done_vwm-distractor');
    sessionStorage.removeItem('practice_done_ant');

    Storage.saveCurrentSession({ name, email, age, gender, handle, startedAt: new Date().toISOString(), trials: [], metadata });
    navigate('instructions', { task: 'vwm-pure' });
  });
}
