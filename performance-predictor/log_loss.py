import numpy as np 

def log_loss(y,y_hat):
    average_loss=np.mean(-((y*np.log(y_hat))+((1-y)*(np.log(1-y_hat)))))

    return average_loss

if __name__=="__main__":
    y = np.array([1, 0, 1, 0])
    y_hat = np.array([0.9, 0.1, 0.2, 0.8])

    print(log_loss(y,y_hat))
        