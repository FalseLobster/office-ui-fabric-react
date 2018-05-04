import * as React from 'react';
import { Image } from '../../Image';
import { Label } from '../../Label';
import { Icon } from '../../Icon';
import { ChoiceGroupOption, OnFocusCallback, OnChangeCallback } from '../../ChoiceGroupOption';
import { IChoiceGroupOption, IChoiceGroupProps, IChoiceGroupStyleProps, IChoiceGroupStyles } from './ChoiceGroup.types';
import {
  assign,
  BaseComponent,
  customizable,
  classNamesFunction,
  createRef,
  getId
} from '../../Utilities';

const getClassNames = classNamesFunction<IChoiceGroupStyleProps, IChoiceGroupStyles>();

export interface IChoiceGroupState {
  keyChecked: string | number;

  /** Is true when the control has focus. */
  keyFocused?: string | number;
}

@customizable('ChoiceGroup', ['theme'])
export class ChoiceGroupBase extends BaseComponent<IChoiceGroupProps, IChoiceGroupState> {
  public static defaultProps: IChoiceGroupProps = {
    options: []
  };

  private _id: string;
  private _labelId: string;
  private _inputElement = createRef<HTMLInputElement>();
  private focusedVars: { [key: string]: OnFocusCallback } = {};
  private changedVars: { [key: string]: OnChangeCallback } = {};

  constructor(props: IChoiceGroupProps, ) {
    super(props);

    this._warnDeprecations({ 'onChanged': 'onChange' });
    this._warnMutuallyExclusive({
      selectedKey: 'defaultSelectedKey'
    });

    this.state = {
      keyChecked: (props.defaultSelectedKey === undefined) ?
        this._getKeyChecked(props)! :
        props.defaultSelectedKey,
      keyFocused: undefined
    };

    this._id = getId('ChoiceGroup');
    this._labelId = getId('ChoiceGroupLabel');
  }

  public componentWillReceiveProps(newProps: IChoiceGroupProps): void {
    const newKeyChecked = this._getKeyChecked(newProps);
    const oldKeyCheched = this._getKeyChecked(this.props);

    if (newKeyChecked !== oldKeyCheched) {
      this.setState({
        keyChecked: newKeyChecked!,
      });
    }
  }

  public render(): JSX.Element {
    const {
      className,
      theme,
      getStyles,
      options,
      label,
      required,
      disabled,
    } = this.props;
    const { keyChecked, keyFocused } = this.state;

    const classNames = getClassNames(getStyles!, {
      theme: theme!,
      className,
      optionsContainIconOrImage: options!.some(option => Boolean(option.iconProps || option.imageSrc))
    });

    return (
      // Need to assign role application on containing div because JAWS doesn't call OnKeyDown without this role
      <div role='application' className={ classNames.applicationRole }>
        <div
          className={ classNames.root }
          role='radiogroup'
          aria-labelledby={ `${this.props.label ? this._id + '-label' : ''} ${(this.props as any)['aria-labelledby'] || ''}` }
        >
          { label && (<Label className={ classNames.label } required={ required } id={ this._id + '-label' }>{ label }</Label>) }
          <div className={ classNames.flexContainer }>
            { options!.map((option: IChoiceGroupOption) => {

              assign(option, {
                focused: option.key === keyFocused,
                checked: option.key === keyChecked,
                disabled: option.disabled || disabled,
                id: `${this._id}-${option.key}`,
                labelId: `${this._labelId}-${option.key}`,
              });

              return (
                <ChoiceGroupOption
                  key={ option.key }
                  onBlur={ this._onBlur }
                  onFocus={ this._onFocus(option.key) }
                  onChange={ this._onChange(option.key) }
                  { ...option }
                />
              );
            }) }
          </div>
        </div>
      </div>
    );

  }

  public focus() {
    if (this._inputElement.current) {
      this._inputElement.current.focus();
    }
  }

  private _onFocus = (key: string) =>
    this.focusedVars[key] ? this.focusedVars[key] : this.focusedVars[key] =
      (ev: React.FocusEvent<HTMLElement>, option: IChoiceGroupOption) => {
        this.setState({
          keyFocused: key,
          keyChecked: this.state.keyChecked
        });
      }

  private _onBlur = (ev: React.FocusEvent<HTMLElement>, option: IChoiceGroupOption) => {
    this.setState({
      keyFocused: undefined,
      keyChecked: this.state.keyChecked
    });
  }

  // (evt?: React.FormEvent<HTMLElement | HTMLInputElement>, props?: IChoiceGroupOption)

  private _onChange = (key: string) =>
    this.changedVars[key] ? this.changedVars[key] : this.changedVars[key] =
      (evt, option) => {
        const { onChanged, onChange, selectedKey } = this.props;

        // Only manage state in uncontrolled scenarios.
        if (selectedKey === undefined) {
          this.setState({
            keyChecked: key
          });
        }

        // TODO: onChanged deprecated, remove else if after 07/17/2017 when onChanged has been removed.
        if (onChange) {
          onChange(evt, option && { key, text: option!.text });
        } else if (onChanged) {
          onChanged(option!);
        }
      }

  private _getKeyChecked(props: IChoiceGroupProps): string | number | undefined {
    if (props.selectedKey !== undefined) {
      return props.selectedKey;
    }

    const optionsChecked = props.options!.filter((option: IChoiceGroupOption) => {
      return option.checked;
    });

    if (optionsChecked.length === 0) {
      return undefined;
    } else {
      return optionsChecked[0].key;
    }
  }

}