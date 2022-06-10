import React from 'react';
import { render } from '@testing-library/react';
import { DeploymentsComponent } from './DeploymentsComponent';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { setupRequestMockHandlers } from '@backstage/test-utils';
