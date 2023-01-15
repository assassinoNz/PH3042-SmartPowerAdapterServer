export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Mutation = {
  __typename?: 'Mutation';
  SetPower: Scalars['Boolean'];
};


export type MutationSetPowerArgs = {
  deviceId: Scalars['ID'];
  state: Scalars['Boolean'];
};

export type Query = {
  __typename?: 'Query';
  GetLatestReadings: Array<SensorReading>;
};


export type QueryGetLatestReadingsArgs = {
  count: Scalars['Int'];
};

export type SensorReading = {
  __typename?: 'SensorReading';
  current: Scalars['Float'];
  voltage: Scalars['Float'];
  timestamp: Scalars['Int'];
};
