import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Modal from 'react-modal';
import { useEffect } from 'react';

import { storage } from './storage';
import {
    Checkbox,
    Expand,
    InfoRow,
    SettingsRow,
    SettingsSection,
    RadioGroup,
    Radio,
    useStore,
    applyStyle,
    useMessage,
} from '@spadin/webextension-options';

applyStyle();

interface LinkProps extends React.HTMLProps<HTMLAnchorElement> {
}

const ExternalLink: React.FunctionComponent<LinkProps> = (props) => {
    return (
        <a {...props}
            rel="external noopener"
            target="_blank"
            >
            {props.children}
        </a>
    );
}

const OptionsApp: React.FunctionComponent = () => {
    const title = useMessage('optionsTitle');

    useEffect(() => {
        Modal.setAppElement('#app');
        document.title = title;
    });

    const [onOpen] = useStore(storage.onOpen, 'default');
    const [focusOnOpen] = useStore(storage.focusOnOpen, 'default');

    return (
        <>
        <header>
            <img src="../images/icon-64.png" />
            <h1>{title}</h1>
        </header>
        <main>
            <SettingsSection title={useMessage('whenOpeningTab')}>
                <SettingsRow>
                    <RadioGroup accessor={storage.onOpen}>
                        <Radio value="default">
                            {useMessage('openTabDefault')}
                            <div className="secondary">
                                {useMessage('openTabDefaultNote')}
                            </div>
                        </Radio>
                        <Radio value="nextToActive">{useMessage('openTabNextToActive')}</Radio>
                        <Expand isOpen={onOpen == 'nextToActive'}>
                            <SettingsRow>
                                <Checkbox label={useMessage('placeTabsInOrder')} accessor={storage.openInOrder} />
                            </SettingsRow>
                        </Expand>
                        <Radio value="otherAtEnd">{useMessage('openSpeedDialNextToActive')}</Radio>
                        <Radio value="atEnd">{useMessage('openTabAtEnd')}</Radio>
                    </RadioGroup>
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title={useMessage('whenClosingTab')}>
                <SettingsRow>
                    <RadioGroup accessor={storage.onClose}>
                        <Radio value="default">
                            {useMessage('closeTabDefault')}
                            <div className="secondary">
                                {useMessage('closeTabDefaultNote')}
                            </div>
                        </Radio>
                        <Radio value="lastfocused">{useMessage('activateLastActiveTab')}</Radio>
                        <Radio value="next">{useMessage('activateNextTab')}</Radio>
                        <Radio value="previous">{useMessage('activatePreviousTab')}</Radio>
                    </RadioGroup>
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title={useMessage('whenOpeningLinkInNewTab')}>
                <SettingsRow>
                    <RadioGroup accessor={storage.focusOnOpen}>
                        <Radio value="default">{useMessage('openLinkDefault')}</Radio>
                        <Radio value="always">{useMessage('focusNewTab')}</Radio>
                        <Expand isOpen={focusOnOpen == 'always'}>
                            <SettingsRow>
                                <Checkbox label={useMessage('openBackgroundCtrl')} accessor={storage.exceptCtrl} />
                            </SettingsRow>
                            <SettingsRow>
                                <Checkbox label={useMessage('openBackgroundShift')} accessor={storage.exceptShift} />
                            </SettingsRow>
                        </Expand>
                    </RadioGroup>
                </SettingsRow>

                <SettingsRow>
                    <Checkbox
                        label={useMessage('shiftClickSameWindow')}
                        description={useMessage('ctrlShiftNote')}
                        accessor={storage.preventNewWindow} />
                </SettingsRow>

                <SettingsRow>
                    <Checkbox label={useMessage('preventNewWindows')} accessor={storage.preventWindowPopups} />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Frequently Asked Questions">
                <InfoRow>
                    <h4>Something is broken!</h4>
                    <p>
                        Check if someone else has reported the issue on
                        {' '}<ExternalLink href="https://github.com/ChaosinaCan/ClassicTabs/issues">GitHub</ExternalLink>.
                        If not, create a new issue, and let me know what you expected to happen
                        and what actually happened instead.
                    </p>
                </InfoRow>

                <InfoRow>
                    <h4>
                        Can you make <code>Ctrl+T</code> open tabs next to the active tab
                        but the new tab button open them at the end?
                    </h4>
                    <p>
                        Nope. As far as Opera is concerned, new tabs are new tabs.
                        I cannot differentiate between tabs opened with a keyboard
                        shortcut, mouse gesture, or the new tab button.
                    </p>
                </InfoRow>

                <InfoRow>
                    <h4>When I restore a closed tab, why doesn't it go back to its original location?</h4>
                    <p>
                        See above. Restored tabs are just new tabs.
                    </p>
                </InfoRow>

                <InfoRow>
                    <h4>Can you make <code>Ctrl+Tab</code> cycle through tabs in last-visited order?</h4>
                    <p>
                        No, but Opera can.
                        Check the <strong>User Interface</strong> section of Opera's advanced settings
                        for the <strong>Cycle tabs in most recently used order</strong> setting.
                    </p>
                </InfoRow>

                <InfoRow>
                    <h4>Can you make <code>&lt;keyboard shortcut&gt;</code> do <code>&lt;cool feature&gt;</code>?</h4>
                    <p>
                        Maybe. Opera has implemented the chrome.commands API, but some functions
                        aren't available to extensions. Create an issue on
                        {' '}<ExternalLink href="https://github.com/ChaosinaCan/ClassicTabs/issues">GitHub</ExternalLink>{' '}
                        requesting a feature and I'll let you know if it's possible.
                    </p>
                </InfoRow>

                <InfoRow>
                    <h4>Can you make <code>&lt;mouse command&gt;</code> on a tab do <code>&lt;cool feature&gt;</code>?</h4>
                    <p>
                        No. Browser extensions have very limited access to the browser's UI.
                        They cannot tell when you click on a tab.
                    </p>
                </InfoRow>

                <InfoRow>
                    <h4>Can you add things to the tab context menu?</h4>
                    <p>
                        See above.
                    </p>
                </InfoRow>

                <InfoRow>
                    <h4>Tab stacking?</h4>
                    <p>
                        Try <ExternalLink href="https://vivaldi.com">Vivaldi</ExternalLink>.
                    </p>
                </InfoRow>
            </SettingsSection>
        </main>
        </>
    );
}

addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<OptionsApp />, document.getElementById('app'));
});
