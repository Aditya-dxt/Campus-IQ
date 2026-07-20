import numpy as np


def standardize(X_train, X_test):
    mean = np.mean(X_train, axis=0)
    std = np.std(X_train, axis=0)
    standardized_X_train = (X_train - mean) / std
    standardized_X_test = (X_test - mean) / std
    return standardized_X_train, standardized_X_test